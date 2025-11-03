import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { Repository } from 'typeorm';
import { OtpService } from './services/otp.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly otpService: OtpService,
  ) {}

  /**
   * Send Otp to phone number
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
  async verifyOtp(phone: string, code: string): Promise<any> {
    try {
      await this.otpService.verifyOtp(phone, code);

      let user = await this.userRepository.findOne({ where: { phone } });

      if (!user) {
        user = this.userRepository.create({ phone });
        await this.userRepository.save(user);
        this.logger.log(`New user created: ${phone}`);
      }

      // TODO: Generate session token
      const token = 'placeholder-token-' + Date.now();
      return {
        success: true,
        message: 'OTP verified successfully',
        data: {
          user: {
            id: user.id,
            phone: user.phone,
          },
          token,
        },
      };
    } catch (error) {
      this.logger.error(`Error verifying OTP for ${phone}:`, error);
      throw error;
    }
  }
}
