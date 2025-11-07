import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { Repository } from 'typeorm';
import { OtpService } from './services/otp.service';
import { TokenService } from './services/token.service';
import { DeviceInfo } from './interfaces/token.interface';
import { SmsService } from './services/sms.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
    private readonly smsService: SmsService,
  ) {}

  /**
   * Send OTP to phone number
   * @param phone
   * @returns
   */
  async sendOtp(phone: string): Promise<any> {
    try {
      // Generate and store OTP
      const code = await this.otpService.generateAndStoreOtp(phone);

      // Send SMS via sms.ir
      const smsResponse = await this.smsService.sendOtp(phone, code);

      // Check if SMS was sent successfully
      if (!this.smsService.isSuccessResponse(smsResponse)) {
        this.logger.error(
          `Failed to send SMS to ${phone}. Status: ${smsResponse.status}, Message: ${smsResponse.message}`,
        );

        // In sandbox mode, still return success for testing
        if (process.env.SMS_SANDBOX === 'true') {
          this.logger.warn(
            `⚠️ Sandbox mode: SMS failed but returning success for testing. Code: ${code}`,
          );

          return {
            success: true,
            message: 'OTP sent successfully (Sandbox mode)',
            data: {
              phone,
              code, // Show code in sandbox mode
              smsStatus: smsResponse.status,
              smsMessage: smsResponse.message,
            },
          };
        }

        // In production, throw error
        const errorMessage = this.smsService.getErrorMessage(
          smsResponse.status,
        );

        throw new BadRequestException({
          success: false,
          error: {
            code: 'SMS_SEND_FAILED',
            message: `Failed to send SMS: ${errorMessage}`,
            statusCode: 400,
            smsStatus: smsResponse.status,
          },
        });
      }

      // Success response
      this.logger.log(`✅ OTP sent successfully to ${phone}`);

      return {
        success: true,
        message: 'OTP sent successfully',
        data: {
          phone,
          messageId: smsResponse.data?.messageId,
          // Show code only in development mode
          ...(process.env.NODE_ENV === 'development' && { code }),
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

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
