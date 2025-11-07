import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamService } from './team.service';
import { Team } from '../../database/entities/team.entity';
import { RedisService } from '../redis/redis.service';
import { NotFoundException } from '@nestjs/common';

describe('TeamService', () => {
  let service: TeamService;
  let repository: jest.Mocked<Repository<Team>>;
  let redisService: jest.Mocked<RedisService>;

  const mockTeams: Team[] = [
    {
      id: 'team-1',
      fa_name: 'ایران',
      eng_name: 'Iran',
      order: 1,
      group: 'E',
      flag: '🇮🇷',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 'team-2',
      fa_name: 'پرتغال',
      eng_name: 'Portugal',
      order: 2,
      group: 'E',
      flag: '🇵🇹',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamService,
        {
          provide: getRepositoryToken(Team),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
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

    service = module.get<TeamService>(TeamService);
    repository = module.get(getRepositoryToken(Team));
    redisService = module.get(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllTeams', () => {
    it('should return all teams from database when cache miss', async () => {
      redisService.get.mockResolvedValue(null);
      repository.find.mockResolvedValue(mockTeams);
      redisService.set.mockResolvedValue(undefined);

      const result = await service.getAllTeams();

      expect(result).toEqual(mockTeams);
      expect(repository.find).toHaveBeenCalledWith({
        order: { order: 'ASC', fa_name: 'ASC' },
      });
      expect(redisService.set).toHaveBeenCalled();
    });

    it('should return teams from cache when cache hit', async () => {
      // When data comes from cache, dates are serialized as strings
      const cachedTeams = mockTeams.map((team) => ({
        ...team,
        created_at: team.created_at.toISOString(),
        updated_at: team.updated_at.toISOString(),
      }));
      redisService.get.mockResolvedValue(JSON.stringify(cachedTeams));

      const result = await service.getAllTeams();

      // Dates will be strings when coming from cache
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(mockTeams[0].id);
      expect(result[0].fa_name).toBe(mockTeams[0].fa_name);
      expect(typeof result[0].created_at).toBe('string');
      expect(typeof result[0].updated_at).toBe('string');
      expect(repository.find).not.toHaveBeenCalled();
    });
  });

  describe('getTeamsByGroups', () => {
    it('should return teams organized by groups', async () => {
      redisService.get.mockResolvedValue(null);
      repository.find.mockResolvedValue(mockTeams);
      redisService.set.mockResolvedValue(undefined);

      const result = await service.getTeamsByGroups();

      expect(result).toHaveProperty('E');
      expect(result.E).toHaveLength(2);
      expect(redisService.set).toHaveBeenCalled();
    });
  });

  describe('getTeamById', () => {
    it('should return a team by ID', async () => {
      repository.findOne.mockResolvedValue(mockTeams[0]);

      const result = await service.getTeamById('team-1');

      expect(result).toEqual(mockTeams[0]);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'team-1' },
      });
    });

    it('should throw NotFoundException when team not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.getTeamById('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('searchTeams', () => {
    it('should search teams by name', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockTeams[0]]),
      };

      repository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await service.searchTeams('Iran');

      expect(result).toEqual([mockTeams[0]]);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.orWhere).toHaveBeenCalled();
    });
  });

  describe('clearCache', () => {
    it('should clear team cache', async () => {
      redisService.del.mockResolvedValue(1);

      await service.clearCache();

      // clearCache clears 3 cache keys: all teams, by group, and no group
      expect(redisService.del).toHaveBeenCalledTimes(3);
    });
  });
});
