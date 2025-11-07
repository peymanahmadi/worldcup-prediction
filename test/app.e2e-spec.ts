import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { TokenService } from '../src/modules/auth/services/token.service';
import { AuthGuard } from '../src/common/guards/auth.guard';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Authentication (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    // Set NODE_ENV to development so OTP code is returned
    process.env.NODE_ENV = 'development';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Set up global exception filter
    app.useGlobalFilters(new GlobalExceptionFilter());

    // Set up global validation pipe (matching main.ts)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    // Initialize app first before getting services
    await app.init();

    // Set up global authentication guard (matching main.ts)
    const reflector = app.get(Reflector);
    const tokenService = app.get(TokenService);
    app.useGlobalGuards(new AuthGuard(reflector, tokenService));
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/send-otp (POST)', () => {
    it('should send OTP successfully', () => {
      const testPhone = `0912${Date.now().toString().slice(-7)}`;

      return request(app.getHttpServer())
        .post('/auth/send-otp')
        .send({ phone: testPhone })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.phone).toBe(testPhone);
          expect(res.body.data.code).toBeDefined(); // In dev mode
        });
    });

    it('should reject invalid phone number format', () => {
      return request(app.getHttpServer())
        .post('/auth/send-otp')
        .send({ phone: '123456' })
        .expect(400);
    });

    it('should reject non-Iranian phone number', () => {
      return request(app.getHttpServer())
        .post('/auth/send-otp')
        .send({ phone: '01234567890' }) // Starts with 01 instead of 09
        .expect(400);
    });

    it('should enforce rate limit per phone number', async () => {
      const testPhone = `0913${Date.now().toString().slice(-7)}`;

      // First request - should succeed
      await request(app.getHttpServer())
        .post('/auth/send-otp')
        .send({ phone: testPhone })
        .expect(200);

      // Second request immediately to same phone - should be blocked
      const response = await request(app.getHttpServer())
        .post('/auth/send-otp')
        .send({ phone: testPhone })
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(response.body.error.retryAfter).toBeDefined();
    });

    it('should allow different phone numbers simultaneously', async () => {
      const phone1 = `0914${Date.now().toString().slice(-7)}`;
      const phone2 = `0915${Date.now().toString().slice(-7)}`;

      // Send OTP to first phone
      await request(app.getHttpServer())
        .post('/auth/send-otp')
        .send({ phone: phone1 })
        .expect(200);

      // Send OTP to second phone immediately - should work
      await request(app.getHttpServer())
        .post('/auth/send-otp')
        .send({ phone: phone2 })
        .expect(200);
    });
  });

  describe('/auth/verify-otp (POST)', () => {
    let testPhone: string;
    let otpCode: string;

    beforeEach(async () => {
      // Generate unique phone for each test
      testPhone = `0916${Date.now().toString().slice(-7)}`;

      // Send OTP first
      const response = await request(app.getHttpServer())
        .post('/auth/send-otp')
        .send({ phone: testPhone });

      otpCode = response.body.data.code;
    });

    it('should verify OTP successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({ phone: testPhone, code: otpCode })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.token).toBeDefined();
          expect(res.body.data.user).toBeDefined();
          expect(res.body.data.user.phone).toBe(testPhone);
        });
    });

    it('should reject invalid OTP code', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({ phone: testPhone, code: '000000' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('OTP_INVALID');
      expect(response.body.error.remainingAttempts).toBeDefined();
      expect(response.body.error.remainingAttempts).toBeLessThan(5);
    });

    it('should reject OTP for wrong phone number', async () => {
      const wrongPhone = `0917${Date.now().toString().slice(-7)}`;

      const response = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({ phone: wrongPhone, code: otpCode })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('OTP_NOT_FOUND');
    });

    it('should enforce 5 attempt limit per phone number', async () => {
      const phone = `0918${Date.now().toString().slice(-7)}`;

      // Send OTP
      await request(app.getHttpServer()).post('/auth/send-otp').send({ phone });

      // Try 5 times with wrong code
      for (let i = 1; i <= 5; i++) {
        const response = await request(app.getHttpServer())
          .post('/auth/verify-otp')
          .send({ phone, code: '000000' });

        if (i < 5) {
          expect(response.status).toBe(400);
          expect(response.body.error.code).toBe('OTP_INVALID');
        } else {
          // 5th attempt should trigger verify limit
          expect(response.status).toBe(429);
          expect(response.body.error.code).toBe('OTP_VERIFY_LIMIT_EXCEEDED');
        }
      }
    });

    it('should reject verification without sending OTP first', async () => {
      const phone = `0919${Date.now().toString().slice(-7)}`;

      const response = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({ phone, code: '123456' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('OTP_NOT_FOUND');
    });

    it('should create new user on first successful verification', async () => {
      const newPhone = `0920${Date.now().toString().slice(-7)}`;

      // Send OTP
      const sendResponse = await request(app.getHttpServer())
        .post('/auth/send-otp')
        .send({ phone: newPhone });

      const code = sendResponse.body.data.code;

      // Verify OTP
      const verifyResponse = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({ phone: newPhone, code })
        .expect(200);

      expect(verifyResponse.body.data.user).toBeDefined();
      expect(verifyResponse.body.data.user.id).toBeDefined();
      expect(verifyResponse.body.data.user.phone).toBe(newPhone);
    });
  });
});
