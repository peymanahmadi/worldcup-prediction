import { Injectable, Logger } from '@nestjs/common';
import { TokenService } from './token.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name);

  constructor(private readonly tokenService: TokenService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCron() {
    this.logger.log('Running session cleanup...');

    try {
      const deletedCount = await this.tokenService.cleanupExpiredSessions();
      this.logger.log(
        `Session cleanup completed. Deleted ${deletedCount} expired sessions`,
      );
    } catch (error) {
      this.logger.error('Session cleanup failed:', error);
    }
  }
}
