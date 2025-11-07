import { Repository } from 'typeorm';
import { TokenService } from './token.service';
import { Session } from '@database/entities/session.entity';
import { User } from '@database/entities/user.entity';
import { RedisService } from '@modules/redis/redis.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('TokenService', () => {
  let service: TokenService;
  let sessionRepository: jest.Mocked<Repository<Session>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let redisService: jest.Mocked<RedisService>;

  const mockUser: User = {
    id: 'user-uuid',
    phone: '09123456789',
    password_hash: '',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    sessions: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: getRepositoryToken(Session),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    sessionRepository = module.get(getRepositoryToken(Session));
    userRepository = module.get(getRepositoryToken(User));
    redisService = module.get(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should create a new session and return token', async () => {
      const mockSession = {
        id: 'session-uuid',
        user_id: mockUser.id,
        token: 'generated-token',
        token_hash: 'hashed-token',
        device_info: {},
        is_active: true,
        expires_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        last_used_at: null,
        user: mockUser,
      };

      sessionRepository.create.mockReturnValue(mockSession as any);
      sessionRepository.save.mockResolvedValue(mockSession as any);
      redisService.set.mockResolvedValue(undefined);

      const result = await service.createSession(mockUser);

      expect(result.token).toBeDefined();
      expect(result.session).toBeDefined();
      expect(sessionRepository.create).toHaveBeenCalled();
      expect(sessionRepository.save).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalled();
    });
  });

  describe('validateToken', () => {
    it('should validate token and return session', async () => {
      const token = 'valid-token';
      const mockSession = {
        id: 'session-uuid',
        user_id: mockUser.id,
        token,
        is_active: true,
        expires_at: new Date(Date.now() + 86400000), // Tomorrow
        user: mockUser,
      };

      sessionRepository.findOne.mockResolvedValue(mockSession as any);
      sessionRepository.update.mockResolvedValue(undefined as any);
      redisService.get.mockResolvedValue(null);
      redisService.set.mockResolvedValue(undefined);

      const result = await service.validateToken(token);

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockSession.id);
    });

    it('should return null for expired token', async () => {
      const token = 'expired-token';
      const mockSession = {
        id: 'session-uuid',
        user_id: mockUser.id,
        token,
        is_active: true,
        expires_at: new Date(Date.now() - 86400000), // Yesterday
        user: mockUser,
      };

      sessionRepository.findOne.mockResolvedValue(mockSession as any);
      sessionRepository.update.mockResolvedValue(undefined as any);

      const result = await service.validateToken(token);

      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      const token = 'valid-token';
      const inactiveUser = { ...mockUser, is_active: false };
      const mockSession = {
        id: 'session-uuid',
        user_id: inactiveUser.id,
        token,
        is_active: true,
        expires_at: new Date(Date.now() + 86400000),
        user: inactiveUser,
      };

      sessionRepository.findOne.mockResolvedValue(mockSession as any);
      redisService.get.mockResolvedValue(null);

      const result = await service.validateToken(token);

      expect(result).toBeNull();
    });
  });

  describe('invalidateSession', () => {
    it('should invalidate session successfully', async () => {
      const sessionId = 'session-uuid';
      const mockSession = {
        id: sessionId,
        token: 'some-token',
      };

      sessionRepository.findOne.mockResolvedValue(mockSession as any);
      sessionRepository.update.mockResolvedValue(undefined as any);
      redisService.del.mockResolvedValue(1);

      const result = await service.invalidateSession(sessionId);

      expect(result).toBe(true);
      expect(sessionRepository.update).toHaveBeenCalledWith(sessionId, {
        is_active: false,
      });
      expect(redisService.del).toHaveBeenCalled();
    });
  });

  describe('getUserSessions', () => {
    it('should return all active sessions for user', async () => {
      const userId = 'user-uuid';
      const mockSessions = [
        {
          id: 'session-1',
          user_id: userId,
          device_info: { platform: 'Windows' },
          created_at: new Date(),
          last_used_at: new Date(),
          expires_at: new Date(),
          is_active: true,
        },
        {
          id: 'session-2',
          user_id: userId,
          device_info: { platform: 'iOS' },
          created_at: new Date(),
          last_used_at: null,
          expires_at: new Date(),
          is_active: true,
        },
      ];

      sessionRepository.find.mockResolvedValue(mockSessions as any);

      const result = await service.getUserSessions(userId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('session-1');
      expect(result[1].id).toBe('session-2');
    });
  });
});
