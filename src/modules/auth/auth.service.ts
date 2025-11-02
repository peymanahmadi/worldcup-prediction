import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  async sendOtp(phone: string) {
    return {
      success: true,
      message: 'OTP sent successfully',
      data: { phone },
    };
  }

  async verifyOtp(phone: string, code: string) {
    return {
      success: true,
      message: 'OTP verified successfully',
      data: { phone, token: 'token' },
    };
  }
}
