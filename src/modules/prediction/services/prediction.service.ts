import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prediction } from '../../../database/entities/prediction.entity';
import { PredictionResult } from '../../../database/entities/prediction-result.entity';
import { User } from '../../../database/entities/user.entity';
import { PredictionValidationService } from './prediction-validation.service';

@Injectable()
export class PredictionService {
  private readonly logger = new Logger(PredictionService.name);

  constructor(
    @InjectRepository(Prediction)
    private readonly predictionRepository: Repository<Prediction>,
    @InjectRepository(PredictionResult)
    private readonly predictionResultRepository: Repository<PredictionResult>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly validationService: PredictionValidationService,
  ) {}

  /**
   * Submit or update user prediction
   */
  async submitPrediction(
    userId: string,
    groups: { [key: string]: string[][] },
  ): Promise<Prediction> {
    try {
      // Validate prediction
      await this.validationService.validatePrediction(groups);

      // Check if user already has a prediction
      let prediction = await this.predictionRepository.findOne({
        where: { user_id: userId },
      });

      if (prediction && prediction.is_finalized) {
        throw new ConflictException({
          success: false,
          error: {
            code: 'PREDICTION_ALREADY_FINALIZED',
            message: 'Cannot modify a finalized prediction',
            statusCode: 409,
          },
        });
      }

      // Normalize the data structure (flatten if needed)
      const normalizedGroups: { [key: string]: string[][] } = {};
      for (const [group, teams] of Object.entries(groups)) {
        // Ensure each team is in its own array for consistent structure
        normalizedGroups[group] = teams as string[][];
      }

      const predictionData = normalizedGroups;

      if (prediction) {
        // Update existing prediction
        prediction.predict = predictionData;
        prediction.updated_at = new Date();

        this.logger.log(`Updated prediction for user ${userId}`);
      } else {
        // Create new prediction
        prediction = this.predictionRepository.create({
          user_id: userId,
          predict: predictionData,
          is_finalized: false,
        });

        this.logger.log(`Created new prediction for user ${userId}`);
      }

      return await this.predictionRepository.save(prediction);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `Error submitting prediction for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Finalize prediction (make it immutable)
   */
  async finalizePrediction(userId: string): Promise<Prediction> {
    const prediction = await this.predictionRepository.findOne({
      where: { user_id: userId },
    });

    if (!prediction) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'PREDICTION_NOT_FOUND',
          message: 'No prediction found. Please submit a prediction first',
          statusCode: 404,
        },
      });
    }

    if (prediction.is_finalized) {
      throw new ConflictException({
        success: false,
        error: {
          code: 'ALREADY_FINALIZED',
          message: 'Prediction is already finalized',
          statusCode: 409,
        },
      });
    }

    // Validate before finalizing
    await this.validationService.validatePrediction(prediction.predict as any);

    prediction.is_finalized = true;
    prediction.submitted_at = new Date();

    await this.predictionRepository.save(prediction);

    this.logger.log(`Finalized prediction for user ${userId}`);

    return prediction;
  }

  /**
   * Get user's prediction
   */
  async getUserPrediction(userId: string): Promise<Prediction | null> {
    const prediction = await this.predictionRepository.findOne({
      where: { user_id: userId },
    });

    return prediction;
  }

  /**
   * Get prediction by ID
   */
  async getPredictionById(id: string): Promise<Prediction> {
    const prediction = await this.predictionRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!prediction) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'PREDICTION_NOT_FOUND',
          message: 'Prediction not found',
          statusCode: 404,
        },
      });
    }

    return prediction;
  }

  /**
   * Get user's prediction result
   */
  async getUserPredictionResult(
    userId: string,
  ): Promise<PredictionResult | null> {
    return this.predictionResultRepository.findOne({
      where: { user_id: userId },
      relations: ['prediction'],
    });
  }

  /**
   * Delete user's prediction (only if not finalized)
   */
  async deletePrediction(userId: string): Promise<void> {
    const prediction = await this.predictionRepository.findOne({
      where: { user_id: userId },
    });

    if (!prediction) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'PREDICTION_NOT_FOUND',
          message: 'No prediction found',
          statusCode: 404,
        },
      });
    }

    if (prediction.is_finalized) {
      throw new ConflictException({
        success: false,
        error: {
          code: 'CANNOT_DELETE_FINALIZED',
          message: 'Cannot delete a finalized prediction',
          statusCode: 409,
        },
      });
    }

    await this.predictionRepository.remove(prediction);

    this.logger.log(`Deleted prediction for user ${userId}`);
  }

  /**
   * Get all finalized predictions (for processing)
   */
  async getFinalizedPredictions(limit?: number): Promise<Prediction[]> {
    const query = this.predictionRepository
      .createQueryBuilder('prediction')
      .where('prediction.is_finalized = :finalized', { finalized: true })
      .orderBy('prediction.submitted_at', 'ASC');

    if (limit) {
      query.limit(limit);
    }

    return await query.getMany();
  }

  /**
   * Get prediction count statistics
   */
  async getPredictionStats(): Promise<{
    total: number;
    finalized: number;
    draft: number;
  }> {
    const total = await this.predictionRepository.count();
    const finalized = await this.predictionRepository.count({
      where: { is_finalized: true },
    });
    const draft = total - finalized;

    return { total, finalized, draft };
  }
}
