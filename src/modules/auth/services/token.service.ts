import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../../../database/entities/session.entity';
import { User } from '../../../database/entities/user.entity';
import { RedisService } from '../../redis/redis.service';
import { TOKEN_CONSTANTS } from '../constants/token.constants';
import {
  DeviceInfo,
  TokenPayload,
  SessionInfo,
} from '../interfaces/token.interface';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Generate a cryptographically secure token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(TOKEN_CONSTANTS.TOKEN_LENGTH).toString('hex');
  }

  /**
   * Hash token using bcrypt
   */
  private async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, TOKEN_CONSTANTS.BCRYPT_ROUNDS);
  }

  /**
   * Verify token against hash
   */
  private async verifyToken(token: string, hash: string): Promise<boolean> {
    return bcrypt.compare(token, hash);
  }

  /**
   * Get Redis cache key for token
   */
  private getCacheKey(token: string): string {
    return `${TOKEN_CONSTANTS.CACHE_PREFIX}${token}`;
  }

  /**
   * Parse user agent to extract device info
   */
  private parseUserAgent(userAgent?: string): {
    platform?: string;
    browser?: string;
  } {
    if (!userAgent) return {};

    const platform = userAgent.match(/(Windows|Mac|Linux|Android|iOS)/i)?.[1];
    const browser = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)/i)?.[1];

    return { platform, browser };
  }

  /**
   * Create a new session and return token
   */
  async createSession(
    user: User,
    deviceInfo?: Partial<DeviceInfo>,
  ): Promise<{ token: string; session: Session }> {
    try {
      // Generate unique token
      const token = this.generateSecureToken();
      const tokenHash = await this.hashToken(token);

      // Parse device info
      const parsedDeviceInfo = {
        ...deviceInfo,
        ...this.parseUserAgent(deviceInfo?.userAgent),
      };

      // Calculate expiry
      const expiresAt = new Date();
      expiresAt.setDate(
        expiresAt.getDate() + TOKEN_CONSTANTS.TOKEN_EXPIRY_DAYS,
      );

      // Create session
      const session = this.sessionRepository.create({
        user_id: user.id,
        token,
        token_hash: tokenHash,
        device_info: parsedDeviceInfo,
        expires_at: expiresAt,
        is_active: true,
      });

      await this.sessionRepository.save(session);

      // Cache session in Redis
      await this.cacheSession(token, session);

      this.logger.log(`Session created for user ${user.id}: ${session.id}`);

      return { token, session };
    } catch (error) {
      this.logger.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Cache session in Redis
   */
  private async cacheSession(token: string, session: Session): Promise<void> {
    const cacheData = {
      sessionId: session.id,
      userId: session.user_id,
      expiresAt: session.expires_at.toISOString(),
    };

    const key = this.getCacheKey(token);
    await this.redisService.set(
      key,
      JSON.stringify(cacheData),
      TOKEN_CONSTANTS.CACHE_TTL,
    );
  }

  /**
   * Validate token and return session
   */
  async validateToken(token: string): Promise<Session | null> {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(token);
      const cached = await this.redisService.get(cacheKey);

      let session: Session | null = null;

      if (cached) {
        // Get from database using cached session ID
        const cacheData = JSON.parse(cached);
        session = await this.sessionRepository.findOne({
          where: { id: cacheData.sessionId },
          relations: ['user'],
        });
      } else {
        // Cache miss - query database by token
        // Note: We need to find by token (not hash) which is stored in plain text
        session = await this.sessionRepository.findOne({
          where: { token, is_active: true },
          relations: ['user'],
        });
      }

      if (!session) {
        return null;
      }

      // Check if session is expired
      if (new Date() > new Date(session.expires_at)) {
        await this.invalidateSession(session.id);
        return null;
      }

      // Check if user is active
      if (!session.user.is_active) {
        return null;
      }

      // Update last used timestamp
      await this.updateLastUsed(session.id);

      // Re-cache if it was a cache miss
      if (!cached) {
        await this.cacheSession(token, session);
      }

      return session;
    } catch (error) {
      this.logger.error('Error validating token:', error);
      return null;
    }
  }

  /**
   * Update last used timestamp
   */
  private async updateLastUsed(sessionId: string): Promise<void> {
    try {
      await this.sessionRepository.update(sessionId, {
        last_used_at: new Date(),
      });
    } catch (error) {
      // Non-critical error, just log it
      this.logger.warn(
        `Failed to update last_used_at for session ${sessionId}`,
      );
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    const sessions = await this.sessionRepository.find({
      where: { user_id: userId, is_active: true },
      order: { created_at: 'DESC' },
    });

    return sessions.map((session) => ({
      id: session.id,
      deviceInfo: session.device_info || {},
      createdAt: session.created_at,
      lastUsedAt: session.last_used_at,
      expiresAt: session.expires_at,
      isActive: session.is_active,
    }));
  }

  /**
   * Invalidate a specific session
   */
  async invalidateSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId },
      });

      if (!session) {
        return false;
      }

      // Mark as inactive in database
      await this.sessionRepository.update(sessionId, { is_active: false });

      // Remove from cache
      const cacheKey = this.getCacheKey(session.token);
      await this.redisService.del(cacheKey);

      this.logger.log(`Session invalidated: ${sessionId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error invalidating session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateAllUserSessions(userId: string): Promise<number> {
    try {
      const sessions = await this.sessionRepository.find({
        where: { user_id: userId, is_active: true },
      });

      // Mark all as inactive
      await this.sessionRepository.update(
        { user_id: userId, is_active: true },
        { is_active: false },
      );

      // Remove all from cache
      for (const session of sessions) {
        const cacheKey = this.getCacheKey(session.token);
        await this.redisService.del(cacheKey);
      }

      this.logger.log(
        `All sessions invalidated for user ${userId}: ${sessions.length}`,
      );
      return sessions.length;
    } catch (error) {
      this.logger.error(
        `Error invalidating all sessions for user ${userId}:`,
        error,
      );
      return 0;
    }
  }

  /**
   * Clean up expired sessions (can be run as a cron job)
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await this.sessionRepository
        .createQueryBuilder()
        .delete()
        .where('expires_at < :now', { now: new Date() })
        .execute();

      const deletedCount = result.affected || 0;

      if (deletedCount > 0) {
        this.logger.log(`Cleaned up ${deletedCount} expired sessions`);
      }

      return deletedCount;
    } catch (error) {
      this.logger.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  }

  /**
   * Check if user can delete a session
   */
  async canUserDeleteSession(
    userId: string,
    sessionId: string,
  ): Promise<boolean> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    return session?.user_id === userId;
  }
}
