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

@Module({
  imports: [TypeOrmModule.forFeature([User, Session])],
  controllers: [AuthController],
  providers: [AuthService, OtpService, TokenService, RateLimitGuard, AuthGuard],
  exports: [AuthService, OtpService, TokenService, AuthGuard],
})
export class AuthModule {}
