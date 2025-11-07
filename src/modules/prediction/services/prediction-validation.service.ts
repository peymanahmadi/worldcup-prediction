import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../../../database/entities/team.entity';

@Injectable()
export class PredictionValidationService {
  private readonly logger = new Logger(PredictionValidationService.name);

  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
  ) {}

  /**
   * Validate prediction structure and data
   */
  async validatePrediction(groups: {
    [key: string]: string[][];
  }): Promise<void> {
    // 1. Check if all 12 groups exist
    const requiredGroups = [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
    ];
    const providedGroups = Object.keys(groups);

    const missingGroups = requiredGroups.filter(
      (g) => !providedGroups.includes(g),
    );
    if (missingGroups.length > 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'MISSING_GROUPS',
          message: `Missing groups: ${missingGroups.join(', ')}`,
          statusCode: 400,
        },
      });
    }

    // 2. Check if each group has exactly 4 teams
    for (const [group, teams] of Object.entries(groups)) {
      if (!Array.isArray(teams)) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'INVALID_GROUP_FORMAT',
            message: `Group ${group} must be an array of team arrays`,
            statusCode: 400,
          },
        });
      }

      // Flatten teams (handle nested arrays from SQL format)
      const flatTeams = teams.flat();

      if (flatTeams.length !== 4) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'INVALID_GROUP_SIZE',
            message: `Group ${group} must contain exactly 4 teams (found ${flatTeams.length})`,
            statusCode: 400,
            group,
            count: flatTeams.length,
          },
        });
      }
    }

    // 3. Collect all team IDs (flatten nested arrays)
    const allTeamIds = Object.values(groups)
      .map((teams) => teams.flat())
      .flat();

    // 4. Check if exactly 48 teams are provided (12 groups * 4 teams)
    if (allTeamIds.length !== 48) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INVALID_TOTAL_TEAMS',
          message: `Prediction must contain exactly 48 teams (found ${allTeamIds.length})`,
          statusCode: 400,
        },
      });
    }

    // 5. Check for duplicate teams
    const uniqueTeamIds = new Set(allTeamIds);
    if (uniqueTeamIds.size !== 48) {
      const duplicates = this.findDuplicates(allTeamIds);
      throw new BadRequestException({
        success: false,
        error: {
          code: 'DUPLICATE_TEAMS',
          message: 'Each team must be used exactly once',
          statusCode: 400,
          duplicates,
        },
      });
    }

    // 6. Verify all team IDs exist in database
    const validTeams = await this.teamRepository.findByIds(allTeamIds);

    if (validTeams.length !== 48) {
      const validTeamIds = validTeams.map((t) => t.id);
      const invalidTeamIds = allTeamIds.filter(
        (id) => !validTeamIds.includes(id),
      );

      throw new BadRequestException({
        success: false,
        error: {
          code: 'INVALID_TEAM_IDS',
          message: `Invalid team IDs found`,
          statusCode: 400,
          invalidTeamIds: invalidTeamIds.slice(0, 10), // Show max 10
        },
      });
    }

    // 7. Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const invalidUUIDs = allTeamIds.filter((id) => !uuidRegex.test(id));

    if (invalidUUIDs.length > 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INVALID_UUID_FORMAT',
          message: 'Invalid UUID format detected',
          statusCode: 400,
          invalidUUIDs: invalidUUIDs.slice(0, 5),
        },
      });
    }

    this.logger.log('Prediction validation passed');
  }

  /**
   * Find duplicate values in array
   */
  private findDuplicates(arr: string[]): string[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const item of arr) {
      if (seen.has(item)) {
        duplicates.add(item);
      }
      seen.add(item);
    }

    return Array.from(duplicates);
  }

  /**
   * Get prediction statistics
   */
  getPredictionStatistics(groups: { [key: string]: string[][] }): {
    totalGroups: number;
    totalTeams: number;
    teamsPerGroup: { [key: string]: number };
  } {
    const teamsPerGroup: { [key: string]: number } = {};
    let totalTeams = 0;

    for (const [group, teams] of Object.entries(groups)) {
      const flatTeams = teams.flat();
      teamsPerGroup[group] = flatTeams.length;
      totalTeams += flatTeams.length;
    }

    return {
      totalGroups: Object.keys(groups).length,
      totalTeams,
      teamsPerGroup,
    };
  }
}