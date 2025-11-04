import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../../modules/redis/redis.service';

export interface RateLimitOptions {
  keyPrefix: string;
  points: number; // Number of requests
  duration: number; // Time window in seconds
  extractKey?: (request: any) => string; // Custom key extractor
}

export const RATE_LIMIT_KEY = 'rate_limit';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private reflector: Reflector,
    private redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitOptions = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!rateLimitOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Extract key based on custom extractor or default to phone
    const identifier = rateLimitOptions.extractKey
      ? rateLimitOptions.extractKey(request)
      : request.body?.phone || 'unknown';

    // Create Redis key - only based on phone number
    const key = `${rateLimitOptions.keyPrefix}:${identifier}`;

    try {
      const current = await this.redisService.get(key);
      const count = current ? parseInt(current, 10) : 0;

      if (count >= rateLimitOptions.points) {
        const ttl = await this.redisService.ttl(key);

        this.logger.warn(`Rate limit exceeded for key: ${key}. TTL: ${ttl}s`);

        throw new HttpException(
          {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: `Too many requests. Please try again in ${ttl} seconds`,
              statusCode: HttpStatus.TOO_MANY_REQUESTS,
              retryAfter: ttl,
            },
            timestamp: new Date().toISOString(),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Increment counter
      const newCount = await this.redisService.incr(key);

      // Set TTL on first request
      if (newCount === 1) {
        await this.redisService.expire(key, rateLimitOptions.duration);
      }

      this.logger.debug(
        `Rate limit check passed for ${key}: ${newCount}/${rateLimitOptions.points}`,
      );

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // If Redis fails, allow the request (fail open)
      this.logger.error('Rate limit check failed:', error);
      return true;
    }
  }
}
