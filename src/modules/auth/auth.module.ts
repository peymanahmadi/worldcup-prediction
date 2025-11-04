import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@database/entities/user.entity';
import { OtpService } from './services/otp.service';
import { Session } from '@database/entities/session.entity';
import { TokenService } from './services/token.service';
import { RateLimitGuard } from '@common/guards/rate-limit.guard';
import { AuthGuard } from '@common/guards/auth.guard';
import { ScheduleModule } from '@nestjs/schedule';
import { SessionCleanupService } from './services/session-cleanup.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([User, Session]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    TokenService,
    SessionCleanupService,
    RateLimitGuard,
    AuthGuard,
  ],
  exports: [AuthService, OtpService, TokenService, AuthGuard],
})
export class AuthModule {}
