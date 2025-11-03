import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { OTP_CONSTANTS } from '../constants/otp.constants';
import { OtpData, OtpVerificationResult } from '../interfaces/otp.interface';
import {
  OtpSendLimitException,
  OtpVerifyLimitException,
  OtpInvalidException,
  OtpExpiredException,
  OtpNotFoundException,
} from '../exceptions/otp.exceptions';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Generate a secure 6-digit OTP code
   */
  private generateOtpCode(): string {
    // Generate cryptographically secure random number
    const randomNumber = crypto.randomInt(0, 1000000);
    // Pad with zeros to ensure 6 digits
    return randomNumber.toString().padStart(OTP_CONSTANTS.OTP_LENGTH, '0');
  }

  /**
   * Get Redis key for OTP data
   */
  private getOtpKey(phone: string): string {
    return `${OTP_CONSTANTS.KEY_PREFIX.OTP}${phone}`;
  }

  /**
   * Get Redis key for send limit
   */
  private getSendLimitKey(phone: string): string {
    return `${OTP_CONSTANTS.KEY_PREFIX.SEND_LIMIT}${phone}`;
  }

  /**
   * Get Redis key for verification attempts
   */
  private getVerifyAttemptsKey(phone: string): string {
    return `${OTP_CONSTANTS.KEY_PREFIX.VERIFY_ATTEMPTS}${phone}`;
  }

  /**
   * Check if send limit is exceeded
   */
  async checkSendLimit(phone: string): Promise<boolean> {
    const key = this.getSendLimitKey(phone);
    const exists = await this.redisService.exists(key);

    if (exists) {
      const ttl = await this.redisService.ttl(key);
      this.logger.warn(`Send limit exceeded for ${phone}. TTL: ${ttl}s`);
      throw new OtpSendLimitException(
        `Please wait ${ttl} seconds before requesting a new OTP`,
      );
    }

    return true;
  }

  /**
   * Set send limit (prevents sending OTP again for 2 minutes)
   */
  private async setSendLimit(phone: string): Promise<void> {
    const key = this.getSendLimitKey(phone);
    await this.redisService.set(key, '1', OTP_CONSTANTS.SEND_LIMIT_TTL);
  }

  /**
   * Generate and store OTP
   */
  async generateAndStoreOtp(phone: string): Promise<string> {
    // Check send limit first
    await this.checkSendLimit(phone);

    // Generate OTP code
    const code = this.generateOtpCode();
    const expiresAt = Date.now() + OTP_CONSTANTS.OTP_TTL * 1000;

    // Prepare OTP data
    const otpData: OtpData = {
      code,
      expiresAt,
      attempts: 0,
    };

    // Store in Redis
    const key = this.getOtpKey(phone);
    await this.redisService.set(
      key,
      JSON.stringify(otpData),
      OTP_CONSTANTS.OTP_TTL,
    );

    // Set send limit
    await this.setSendLimit(phone);

    // Reset verification attempts counter
    const attemptsKey = this.getVerifyAttemptsKey(phone);
    await this.redisService.del(attemptsKey);

    this.logger.log(`OTP generated for ${phone} (code: ${code})`);

    return code;
  }

  /**
   * Get stored OTP data
   */
  async getOtpData(phone: string): Promise<OtpData | null> {
    const key = this.getOtpKey(phone);
    const data = await this.redisService.get(key);

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as OtpData;
    } catch (error) {
      this.logger.error(`Error parsing OTP data for ${phone}:`, error);
      return null;
    }
  }

  /**
   * Check verification attempts
   */
  private async checkVerifyAttempts(phone: string): Promise<number> {
    const key = this.getVerifyAttemptsKey(phone);
    const attempts = await this.redisService.get(key);
    const currentAttempts = attempts ? parseInt(attempts, 10) : 0;

    if (currentAttempts >= OTP_CONSTANTS.MAX_VERIFY_ATTEMPTS) {
      this.logger.warn(`Verify limit exceeded for ${phone}`);
      throw new OtpVerifyLimitException(
        'Too many verification attempts. Please request a new OTP',
      );
    }

    return currentAttempts;
  }

  /**
   * Increment verification attempts
   */
  private async incrementVerifyAttempts(phone: string): Promise<number> {
    const key = this.getVerifyAttemptsKey(phone);
    const attempts = await this.redisService.incr(key);

    // Set TTL if this is the first attempt
    if (attempts === 1) {
      await this.redisService.expire(key, OTP_CONSTANTS.VERIFY_ATTEMPTS_TTL);
    }

    return attempts;
  }

  /**
   * Verify OTP code (constant-time comparison for security)
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(phone: string, code: string): Promise<OtpVerificationResult> {
    // Check verification attempts limit
    const currentAttempts = await this.checkVerifyAttempts(phone);

    // Get stored OTP data
    const otpData = await this.getOtpData(phone);

    if (!otpData) {
      this.logger.warn(`No OTP found for ${phone}`);
      throw new OtpNotFoundException();
    }

    // Check if OTP has expired
    if (Date.now() > otpData.expiresAt) {
      this.logger.warn(`OTP expired for ${phone}`);
      await this.deleteOtp(phone);
      throw new OtpExpiredException();
    }

    // Verify code using constant-time comparison
    const isValid = this.constantTimeCompare(code, otpData.code);

    if (!isValid) {
      // Increment attempts
      const attempts = await this.incrementVerifyAttempts(phone);
      const remainingAttempts = OTP_CONSTANTS.MAX_VERIFY_ATTEMPTS - attempts;

      this.logger.warn(
        `Invalid OTP for ${phone}. Attempts: ${attempts}/${OTP_CONSTANTS.MAX_VERIFY_ATTEMPTS}`,
      );

      if (remainingAttempts <= 0) {
        await this.deleteOtp(phone);
        throw new OtpVerifyLimitException();
      }

      throw new OtpInvalidException(remainingAttempts);
    }

    // OTP is valid - clean up
    await this.deleteOtp(phone);
    await this.redisService.del(this.getVerifyAttemptsKey(phone));

    this.logger.log(`OTP verified successfully for ${phone}`);

    return {
      success: true,
      message: 'OTP verified successfully',
    };
  }

  /**
   * Delete OTP from Redis
   */
  async deleteOtp(phone: string): Promise<void> {
    const key = this.getOtpKey(phone);
    await this.redisService.del(key);
  }

  /**
   * Get remaining TTL for OTP
   */
  async getOtpTtl(phone: string): Promise<number> {
    const key = this.getOtpKey(phone);
    return await this.redisService.ttl(key);
  }

  /**
   * Check if OTP exists and is valid
   */
  async otpExists(phone: string): Promise<boolean> {
    const otpData = await this.getOtpData(phone);

    if (!otpData) {
      return false;
    }

    // Check if expired
    if (Date.now() > otpData.expiresAt) {
      await this.deleteOtp(phone);
      return false;
    }

    return true;
  }
}
