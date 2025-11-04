import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@database/entities/user.entity';
import { Repository } from 'typeorm';
import { OtpService } from './services/otp.service';
import { TokenService } from './services/token.service';
import { DeviceInfo } from './interfaces/token.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * Send OTP to phone number
   * @param phone
   * @returns
   */
  async sendOtp(phone: string): Promise<any> {
    try {
      const code = await this.otpService.generateAndStoreOtp(phone);
      // TODO: Send SMS via sms.ir
      // For now
      this.logger.debug(`OTP for ${phone}: ${code}`);

      return {
        success: true,
        message: 'OTP sent successfully',
        data: {
          phone,
          ...(process.env.NODE_ENV === 'development' && { code }),
        },
      };
    } catch (error) {
      this.logger.error(`Error sending OTP to ${phone}:`, error);
      throw error;
    }
  }

  /**
   * Verify OTP and create/login user
   * @param phone
   * @param code
   * @returns
   */
  async verifyOtp(
    phone: string,
    code: string,
    deviceInfo?: DeviceInfo,
  ): Promise<any> {
    try {
      await this.otpService.verifyOtp(phone, code);

      let user = await this.userRepository.findOne({ where: { phone } });

      if (!user) {
        user = this.userRepository.create({ phone });
        await this.userRepository.save(user);
        this.logger.log(`New user created: ${phone}`);
      } else {
        this.logger.log(`User logged in: ${phone}`);
      }

      const { token, session } = await this.tokenService.createSession(
        user,
        deviceInfo,
      );

      return {
        success: true,
        message: 'OTP verified successfully',
        data: {
          user: {
            id: user.id,
            phone: user.phone,
            createdAt: user.created_at,
          },
          token,
          expiresAt: session.expires_at,
        },
      };
    } catch (error) {
      this.logger.error(`Error verifying OTP for ${phone}:`, error);
      throw error;
    }
  }

  /**
   * Get user sessions
   */
  async getUserSessions(userId: string) {
    const sessions = await this.tokenService.getUserSessions(userId);

    return {
      success: true,
      data: {
        sessions,
        total: sessions.length,
      },
    };
  }

  /**
   * Delete a specific session
   */
  async deleteSession(userId: string, sessionId: string) {
    // Check if user owns this session
    const canDelete = await this.tokenService.canUserDeleteSession(
      userId,
      sessionId,
    );

    if (!canDelete) {
      return {
        success: false,
        message: 'Session not found or you do not have permission to delete it',
      };
    }

    const deleted = await this.tokenService.invalidateSession(sessionId);

    return {
      success: deleted,
      message: deleted
        ? 'Session deleted successfully'
        : 'Failed to delete session',
    };
  }

  /**
   * Logout (delete current session)
   */
  async logout(sessionId: string) {
    const deleted = await this.tokenService.invalidateSession(sessionId);

    return {
      success: deleted,
      message: deleted ? 'Logged out successfully' : 'Failed to logout',
    };
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: string) {
    const count = await this.tokenService.invalidateAllUserSessions(userId);

    return {
      success: true,
      message: `Logged out from ${count} device(s)`,
      data: { sessionsClosed: count },
    };
  }
}
