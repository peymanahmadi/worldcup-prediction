import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Team } from '@database/entities/team.entity';
import { IRAN_TEAM_ID } from '@database/seeds/teams.seed';
import { RedisService } from '@modules/redis/redis.service';

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);
  private readonly CACHE_KEY_ALL_TEAMS = 'teams:all';
  private readonly CACHE_KEY_BY_GROUP = 'teams:by_group';
  private readonly CACHE_KEY_NO_GROUP = 'teams:no_group';
  private readonly CACHE_TTL = 86400; // 24 hours

  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Get all teams (cached)
   */
  async getAllTeams(): Promise<Team[]> {
    try {
      const cached = await this.redisService.get(this.CACHE_KEY_ALL_TEAMS);

      if (cached) {
        this.logger.debug('Returning teams from cache');
        return JSON.parse(cached);
      }

      const teams = await this.teamRepository.find({
        order: { order: 'ASC', fa_name: 'ASC' },
      });

      await this.redisService.set(
        this.CACHE_KEY_ALL_TEAMS,
        JSON.stringify(teams),
        this.CACHE_TTL,
      );

      this.logger.log(`Fetched ${teams.length} teams from database`);
      return teams;
    } catch (error) {
      this.logger.error('Error fetching all teams:', error);
      throw error;
    }
  }

  /**
   * Get teams that have groups assigned
   */
  async getTeamsWithGroups(): Promise<Team[]> {
    try {
      const teams = await this.teamRepository.find({
        where: { group: Not(IsNull()) },
        order: { group: 'ASC', order: 'ASC' },
      });

      return teams;
    } catch (error) {
      this.logger.error('Error fetching teams with groups:', error);
      throw error;
    }
  }

  /**
   * Get teams without groups (prediction pool)
   */
  async getTeamsWithoutGroups(): Promise<Team[]> {
    try {
      const cached = await this.redisService.get(this.CACHE_KEY_NO_GROUP);

      if (cached) {
        this.logger.debug('Returning teams without groups from cache');
        return JSON.parse(cached);
      }

      const teams = await this.teamRepository.find({
        where: { group: IsNull() },
        order: { fa_name: 'ASC' },
      });

      await this.redisService.set(
        this.CACHE_KEY_NO_GROUP,
        JSON.stringify(teams),
        this.CACHE_TTL,
      );

      this.logger.log(`Fetched ${teams.length} teams without groups`);
      return teams;
    } catch (error) {
      this.logger.error('Error fetching teams without groups:', error);
      throw error;
    }
  }

  /**
   * Get teams organized by group (only assigned groups)
   */
  async getTeamsByGroups(): Promise<Record<string, Team[]>> {
    try {
      const cached = await this.redisService.get(this.CACHE_KEY_BY_GROUP);

      if (cached) {
        this.logger.debug('Returning teams by group from cache');
        return JSON.parse(cached);
      }

      const teams = await this.teamRepository.find({
        where: { group: Not(IsNull()) },
        order: { group: 'ASC', order: 'ASC' },
      });

      const groupedTeams: Record<string, Team[]> = {};

      teams.forEach((team) => {
        if (team.group) {
          if (!groupedTeams[team.group]) {
            groupedTeams[team.group] = [];
          }
          groupedTeams[team.group].push(team);
        }
      });

      await this.redisService.set(
        this.CACHE_KEY_BY_GROUP,
        JSON.stringify(groupedTeams),
        this.CACHE_TTL,
      );

      this.logger.log(
        `Fetched teams organized by ${Object.keys(groupedTeams).length} groups`,
      );
      return groupedTeams;
    } catch (error) {
      this.logger.error('Error fetching teams by groups:', error);
      throw error;
    }
  }

  /**
   * Get teams in a specific group
   */
  async getTeamsByGroup(group: string): Promise<Team[]> {
    try {
      const teams = await this.teamRepository.find({
        where: { group: group.toUpperCase() },
        order: { order: 'ASC' },
      });

      if (teams.length === 0) {
        throw new NotFoundException(`No teams found in group ${group}`);
      }

      return teams;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching teams for group ${group}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific team by ID
   */
  async getTeamById(id: string): Promise<Team> {
    try {
      const team = await this.teamRepository.findOne({ where: { id } });

      if (!team) {
        throw new NotFoundException(`Team with ID ${id} not found`);
      }

      return team;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching team ${id}:`, error);
      throw error;
    }
  }

  /**
   * Search teams by name (English or Farsi)
   */
  async searchTeams(query: string): Promise<Team[]> {
    try {
      const teams = await this.teamRepository
        .createQueryBuilder('team')
        .where('LOWER(team.eng_name) LIKE LOWER(:query)', {
          query: `%${query}%`,
        })
        .orWhere('team.fa_name LIKE :query', { query: `%${query}%` })
        .orderBy('team.fa_name', 'ASC')
        .getMany();

      return teams;
    } catch (error) {
      this.logger.error(`Error searching teams with query "${query}":`, error);
      throw error;
    }
  }

  /**
   * Get team count
   */
  async getTeamCount(): Promise<{
    total: number;
    withGroups: number;
    withoutGroups: number;
  }> {
    const total = await this.teamRepository.count();
    const withGroups = await this.teamRepository.count({
      where: { group: Not(IsNull()) },
    });
    const withoutGroups = total - withGroups;

    return { total, withGroups, withoutGroups };
  }

  /**
   * Clear team cache
   */
  async clearCache(): Promise<void> {
    await this.redisService.del(this.CACHE_KEY_ALL_TEAMS);
    await this.redisService.del(this.CACHE_KEY_BY_GROUP);
    await this.redisService.del(this.CACHE_KEY_NO_GROUP);
    this.logger.log('Team cache cleared');
  }

  /**
   * Verify Iran team exists with correct UUID
   */
  async verifyIranTeam(): Promise<boolean> {
    const iranTeam = await this.teamRepository.findOne({
      where: { id: IRAN_TEAM_ID },
    });

    return !!iranTeam;
  }
}
