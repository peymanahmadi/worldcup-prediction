import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentSession } from '../../common/decorators/current-session.decorator';
import { User } from '../../database/entities/user.entity';
import { Session } from '../../database/entities/session.entity';
import type { Request } from 'express';

@ApiTags('auth')
@Controller('auth')
@UseGuards(RateLimitGuard, AuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @RateLimit({
    keyPrefix: 'send_otp',
    points: 1,
    duration: 120,
  })
  @ApiOperation({
    summary: 'Send OTP to phone number',
    description: 'Rate limit: 1 request per 2 minutes per phone number',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded',
  })
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtp(sendOtpDto.phone);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @RateLimit({
    keyPrefix: 'verify_otp',
    points: 5,
    duration: 60,
  })
  @ApiOperation({
    summary: 'Verify OTP and get authentication token',
    description: 'Rate limit: 5 attempts per minute per phone number',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
    schema: {
      example: {
        success: true,
        message: 'OTP verified successfully',
        data: {
          user: {
            id: 'uuid',
            phone: '09123456789',
            createdAt: '2024-11-03T10:00:00Z',
          },
          token: 'authentication-token-here',
          expiresAt: '2024-12-03T10:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid OTP',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many attempts',
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto, @Req() req: Request) {
    // Extract device info from request
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.socket?.remoteAddress,
      ...verifyOtpDto.deviceInfo,
    };

    return this.authService.verifyOtp(
      verifyOtpDto.phone,
      verifyOtpDto.code,
      deviceInfo,
    );
  }

  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all active sessions for current user',
    description: 'Returns list of all active sessions with device information',
  })
  @ApiResponse({
    status: 200,
    description: 'Sessions retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          sessions: [
            {
              id: 'session-uuid',
              deviceInfo: {
                userAgent: 'Mozilla/5.0...',
                ip: '192.168.1.1',
                platform: 'Windows',
                browser: 'Chrome',
              },
              createdAt: '2024-11-01T10:00:00Z',
              lastUsedAt: '2024-11-03T10:00:00Z',
              expiresAt: '2024-12-01T10:00:00Z',
              isActive: true,
            },
          ],
          total: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getSessions(@CurrentUser() user: User) {
    return this.authService.getUserSessions(user.id);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a specific session',
    description:
      'Invalidate a specific session by ID. User can only delete their own sessions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Session deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'Session deleted successfully',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
  })
  async deleteSession(
    @CurrentUser() user: User,
    @Param('sessionId') sessionId: string,
  ) {
    return this.authService.deleteSession(user.id, sessionId);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout from current session',
    description:
      'Invalidate the current session (the one used for this request)',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    schema: {
      example: {
        success: true,
        message: 'Logged out successfully',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async logout(@CurrentSession() session: Session) {
    return this.authService.logout(session.id);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout from all devices',
    description: 'Invalidate all active sessions for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out from all devices',
    schema: {
      example: {
        success: true,
        message: 'Logged out from 3 device(s)',
        data: {
          sessionsClosed: 3,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async logoutAll(@CurrentUser() user: User) {
    return this.authService.logoutAll(user.id);
  }
}
