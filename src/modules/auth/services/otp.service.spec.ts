import { RedisService } from '../../redis/redis.service';
import {
  OtpExpiredException,
  OtpInvalidException,
  OtpNotFoundException,
  OtpSendLimitException,
  OtpVerifyLimitException,
} from '../exceptions/otp.exceptions';
import { OtpService } from './otp.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('OtpService', () => {
  let service: OtpService;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            incr: jest.fn(),
            exists: jest.fn(),
            expire: jest.fn(),
            ttl: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
    redisService = module.get(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAndStoreOtp', () => {
    it('should generate and store OTP successfully', async () => {
      redisService.exists.mockResolvedValue(false);
      redisService.set.mockResolvedValue(undefined);

      const phone = '09123456789';
      const code = await service.generateAndStoreOtp(phone);

      expect(code).toHaveLength(6);
      expect(code).toMatch(/^\d{6}$/);
      expect(redisService.set).toHaveBeenCalledTimes(2);
    });

    it('should throw error when send limit exceeded', async () => {
      redisService.exists.mockResolvedValue(true);
      redisService.ttl.mockResolvedValue(90);

      const phone = '09123456789';

      await expect(service.generateAndStoreOtp(phone)).rejects.toThrow(
        OtpSendLimitException,
      );
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP successfully', async () => {
      const phone = '09123456789';
      const code = '123456';
      const otpData = {
        code,
        expiresAt: Date.now() + 120000,
        attempts: 0,
      };

      redisService.get.mockResolvedValueOnce('0'); // attempts
      redisService.get.mockResolvedValueOnce(JSON.stringify(otpData)); // OTP data
      redisService.del.mockResolvedValue(1);

      const result = await service.verifyOtp(phone, code);

      expect(result.success).toBe(true);
      expect(result.message).toBe('OTP verified successfully');
    });

    it('should throw error for invalid OTP', async () => {
      const phone = '09123456789';
      const code = '123456';
      const wrongCode = '654321';
      const otpData = {
        code,
        expiresAt: Date.now() + 120000,
        attempts: 0,
      };

      redisService.get.mockResolvedValueOnce('0'); // attempts
      redisService.get.mockResolvedValueOnce(JSON.stringify(otpData)); // OTP data
      redisService.incr.mockResolvedValue(1);

      await expect(service.verifyOtp(phone, wrongCode)).rejects.toThrow(
        OtpInvalidException,
      );
    });

    it('should throw error when OTP not found', async () => {
      const phone = '09123456789';
      const code = '123456';

      redisService.get.mockResolvedValueOnce('0'); // attempts
      redisService.get.mockResolvedValueOnce(null); // OTP data not found

      await expect(service.verifyOtp(phone, code)).rejects.toThrow(
        OtpNotFoundException,
      );
    });

    it('should throw error when OTP expired', async () => {
      const phone = '09123456789';
      const code = '123456';
      const otpData = {
        code,
        expiresAt: Date.now() - 1000, // Expired
        attempts: 0,
      };

      redisService.get.mockResolvedValueOnce('0'); // attempts
      redisService.get.mockResolvedValueOnce(JSON.stringify(otpData));
      redisService.del.mockResolvedValue(1);

      await expect(service.verifyOtp(phone, code)).rejects.toThrow(
        OtpExpiredException,
      );
    });

    it('should throw error after 5 failed attempts', async () => {
      const phone = '09123456789';
      const code = '123456';

      redisService.get.mockResolvedValueOnce('5'); // Max attempts reached

      await expect(service.verifyOtp(phone, code)).rejects.toThrow(
        OtpVerifyLimitException,
      );
    });
  });

  describe('constantTimeCompare', () => {
    it('should return true for matching strings', () => {
      const result = service['constantTimeCompare']('123456', '123456');
      expect(result).toBe(true);
    });

    it('should return false for different strings', () => {
      const result = service['constantTimeCompare']('123456', '654321');
      expect(result).toBe(false);
    });

    it('should return false for different length strings', () => {
      const result = service['constantTimeCompare']('12345', '123456');
      expect(result).toBe(false);
    });
  });
});
