import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TokenService } from '../src/modules/auth/services/token.service';
import { AuthGuard } from '../src/common/guards/auth.guard';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let sessionId: string;

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

  describe('Complete Authentication Flow', () => {
    const testPhone = `0912${Date.now().toString().slice(-7)}`;
    let otpCode: string;

    it('should send OTP', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/send-otp')
        .send({ phone: testPhone })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBeDefined();
      otpCode = response.body.data.code;
    });

    it('should verify OTP and get token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({
          phone: testPhone,
          code: otpCode,
          deviceInfo: {
            userAgent: 'Test Agent',
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.expiresAt).toBeDefined();

      authToken = response.body.data.token;
    });

    it('should access protected endpoint with token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions).toBeDefined();
      expect(response.body.data.sessions.length).toBeGreaterThan(0);

      sessionId = response.body.data.sessions[0].id;
    });

    it('should reject request without token', async () => {
      await request(app.getHttpServer()).get('/auth/sessions').expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/sessions')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should create multiple sessions', async () => {
      // Send OTP again
      await request(app.getHttpServer())
        .post('/auth/send-otp')
        .send({ phone: testPhone });

      // Wait a bit for rate limit
      await new Promise((resolve) => setTimeout(resolve, 2100));

      // Get new OTP
      const sendResponse = await request(app.getHttpServer())
        .post('/auth/send-otp')
        .send({ phone: testPhone });

      const newCode = sendResponse.body.data.code;

      // Verify with different device
      const verifyResponse = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({
          phone: testPhone,
          code: newCode,
          deviceInfo: {
            userAgent: 'Different Device',
          },
        });

      const newToken = verifyResponse.body.data.token;

      // Check sessions with new token
      const sessionsResponse = await request(app.getHttpServer())
        .get('/auth/sessions')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(sessionsResponse.body.data.sessions.length).toBeGreaterThanOrEqual(
        2,
      );
    });

    it('should delete a specific session', async () => {
      await request(app.getHttpServer())
        .delete(`/auth/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should logout from current session', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Token should no longer work
      await request(app.getHttpServer())
        .get('/auth/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);
    });
  });
});
