import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number' })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    schema: {
      example: {
        success: true,
        message: 'OTP sent successfully',
        data: { phone: '09123456789', code: '123456' },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests',
    schema: {
      example: {
        success: false,
        error: {
          code: 'OTP_SEND_LIMIT_EXCEEDED',
          message: 'You can request OTP only obce every 2 minutes',
          statusCode: 429,
        },
      },
    },
  })
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtp(sendOtpDto.phone);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and get authentication token' })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
    schema: {
      example: {
        success: true,
        message: 'OTP verified successfully',
        data: {
          user: { id: 'uuid', phone: '09123456789' },
          token: 'auth-token',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid OTP',
    schema: {
      example: {
        success: false,
        error: {
          code: 'OTP_INVALID',
          message: 'Invalid OTP code',
          statusCode: 400,
          remainingAttempts: 3,
        },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Too many attempts',
    schema: {
      example: {
        success: false,
        error: {
          code: 'OTP_VERIFY_LIMIT_EXCEEDED',
          message: 'Too many verification attempts',
          statusCode: 429,
        },
      },
    },
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto.phone, verifyOtpDto.code);
  }
}
