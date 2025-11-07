import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prediction } from '../../../database/entities/prediction.entity';
import { PredictionResult } from '../../../database/entities/prediction-result.entity';
import {
  CORRECT_GROUPS,
  IRAN_TEAM_ID,
  getTeamCorrectGroup,
  isIranInCorrectGroup,
} from '../config/correct-groups.config';

export interface ScoringDetails {
  total_misplaced: number;
  iran_correct: boolean;
  complete_groups: string[];
  partial_matches: { [key: string]: number };
  applied_rule: string;
  score: number;
  misplaced_teams?: string[];
}

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  constructor(
    @InjectRepository(PredictionResult)
    private readonly resultRepository: Repository<PredictionResult>,
  ) {}

  /**
   * Calculate score for a single prediction
   */
  calculateScore(prediction: Prediction): ScoringDetails {
    const userPrediction = prediction.predict;

    // Flatten user's prediction to get all teams with their groups
    const userTeamToGroup = this.flattenPrediction(userPrediction);

    // Calculate misplaced teams
    const misplacedTeams = this.getMisplacedTeams(userTeamToGroup);
    const totalMisplaced = misplacedTeams.length;

    // Check Iran condition
    const iranCorrect = isIranInCorrectGroup(userPrediction);

    // Find complete groups (all 4 teams correct)
    const completeGroups = this.getCompleteGroups(userPrediction);

    // Find partial matches (3 teams correct in a group)
    const partialMatches = this.getPartialMatches(userPrediction);

    // Apply scoring rules in priority order
    let score = 0;
    let appliedRule = '';

    // State 1: All 48 teams correct (100 points)
    if (totalMisplaced === 0) {
      score = 100;
      appliedRule = 'state_1';
    }
    // State 2: Only 2 teams misplaced (80 points)
    else if (totalMisplaced === 2) {
      score = 80;
      appliedRule = 'state_2';
    }
    // State 3: Only 3 teams misplaced (60 points)
    else if (totalMisplaced === 3) {
      score = 60;
      appliedRule = 'state_3';
    }
    // State 4: Iran in correct group (50 points)
    else if (iranCorrect) {
      score = 50;
      appliedRule = 'state_4';
    }
    // State 5: One complete group correct (40 points)
    else if (completeGroups.length > 0) {
      score = 40;
      appliedRule = 'state_5';
    }
    // State 6: 3 teams from one group correct (20 points)
    else if (Object.keys(partialMatches).length > 0) {
      score = 20;
      appliedRule = 'state_6';
    }
    // No points
    else {
      score = 0;
      appliedRule = 'no_match';
    }

    const details: ScoringDetails = {
      total_misplaced: totalMisplaced,
      iran_correct: iranCorrect,
      complete_groups: completeGroups,
      partial_matches: partialMatches,
      applied_rule: appliedRule,
      score,
      misplaced_teams: misplacedTeams,
    };

    this.logger.debug(
      `Prediction ${prediction.id}: Score ${score} (${appliedRule})`,
    );

    return details;
  }

  /**
   * Flatten prediction to map: teamId -> userGroup
   */
  private flattenPrediction(prediction: {
    [key: string]: string[][];
  }): Map<string, string> {
    const teamToGroup = new Map<string, string>();

    for (const [group, teams] of Object.entries(prediction)) {
      // Flatten nested arrays
      const flatTeams = teams.flat();

      for (const teamId of flatTeams) {
        teamToGroup.set(teamId, group);
      }
    }

    return teamToGroup;
  }

  /**
   * Get list of misplaced teams
   */
  private getMisplacedTeams(userTeamToGroup: Map<string, string>): string[] {
    const misplaced: string[] = [];

    for (const [teamId, userGroup] of userTeamToGroup.entries()) {
      const correctGroup = getTeamCorrectGroup(teamId);

      if (correctGroup && correctGroup !== userGroup) {
        misplaced.push(teamId);
      }
    }

    return misplaced;
  }

  /**
   * Get list of complete groups (all 4 teams correct)
   */
  private getCompleteGroups(userPrediction: {
    [key: string]: string[][];
  }): string[] {
    const completeGroups: string[] = [];

    for (const [group, teams] of Object.entries(userPrediction)) {
      // Get correct teams for this group
      const correctTeams = CORRECT_GROUPS.groups[group];

      if (!correctTeams) {
        continue;
      }

      // Flatten user's teams for this group
      const userTeams = teams.flat();

      // Check if all 4 teams match (order doesn't matter)
      const allMatch = correctTeams.every((teamId) =>
        userTeams.includes(teamId),
      );

      if (allMatch && correctTeams.length === 4 && userTeams.length === 4) {
        completeGroups.push(group);
      }
    }

    return completeGroups;
  }

  /**
   * Get partial matches (groups with exactly 3 correct teams)
   */
  private getPartialMatches(userPrediction: { [key: string]: string[][] }): {
    [key: string]: number;
  } {
    const partialMatches: { [key: string]: number } = {};

    for (const [group, teams] of Object.entries(userPrediction)) {
      const correctTeams = CORRECT_GROUPS.groups[group];

      if (!correctTeams) {
        continue;
      }

      const userTeams = teams.flat();

      // Count how many teams match
      const matchCount = correctTeams.filter((teamId) =>
        userTeams.includes(teamId),
      ).length;

      // We only care about exactly 3 matches for State 6
      if (matchCount === 3) {
        partialMatches[group] = matchCount;
      }
    }

    return partialMatches;
  }

  /**
   * Process and save prediction result
   */
  async processPrediction(prediction: Prediction): Promise<PredictionResult> {
    // Calculate score
    const details = this.calculateScore(prediction);

    // Create result record
    const result = this.resultRepository.create({
      prediction_id: prediction.id,
      user_id: prediction.user_id,
      total_score: details.score,
      details: details as any,
      processed_at: new Date(),
    });

    await this.resultRepository.save(result);

    this.logger.log(
      `Processed prediction ${prediction.id}: Score ${details.score}`,
    );

    return result;
  }

  /**
   * Get result for a prediction
   */
  async getResult(predictionId: string): Promise<PredictionResult | null> {
    return await this.resultRepository.findOne({
      where: { prediction_id: predictionId },
      order: { processed_at: 'DESC' },
    });
  }

  /**
   * Get result by user ID
   */
  async getResultByUserId(userId: string): Promise<PredictionResult | null> {
    return await this.resultRepository.findOne({
      where: { user_id: userId },
      order: { processed_at: 'DESC' },
    });
  }

  /**
   * Get leaderboard (top scores)
   */
  async getLeaderboard(limit: number = 100): Promise<PredictionResult[]> {
    return await this.resultRepository.find({
      order: {
        total_score: 'DESC',
        processed_at: 'ASC',
      },
      take: limit,
    });
  }

  /**
   * Get statistics about all results
   */
  async getStatistics(): Promise<{
    total_processed: number;
    average_score: number;
    score_distribution: { [key: string]: number };
  }> {
    const results = await this.resultRepository.find();

    const total = results.length;
    const sum = results.reduce((acc, r) => acc + r.total_score, 0);
    const average = total > 0 ? sum / total : 0;

    // Count by applied rule
    const distribution: { [key: string]: number } = {};

    results.forEach((result) => {
      const rule = (result.details as any).applied_rule || 'unknown';
      distribution[rule] = (distribution[rule] || 0) + 1;
    });

    return {
      total_processed: total,
      average_score: Math.round(average * 100) / 100,
      score_distribution: distribution,
    };
  }
}
