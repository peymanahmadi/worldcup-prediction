import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prediction } from '../../database/entities/prediction.entity';
import { PredictionResult } from '../../database/entities/prediction-result.entity';
import { ScoringService } from '../../modules/scoring/services/scoring.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Prediction)
    private readonly predictionRepository: Repository<Prediction>,
    @InjectRepository(PredictionResult)
    private readonly resultRepository: Repository<PredictionResult>,
    private readonly scoringService: ScoringService,
  ) {}

  /**
   * Trigger prediction processing
   */
  async triggerPredictionProcessing(
    reprocess: boolean = false,
    limit?: number,
  ): Promise<{
    queued: number;
    already_processed: number;
    total_finalized: number;
  }> {
    this.logger.log('Starting prediction processing...');

    // Get all finalized predictions
    const query = this.predictionRepository
      .createQueryBuilder('prediction')
      .where('prediction.is_finalized = :finalized', { finalized: true })
      .orderBy('prediction.submitted_at', 'ASC');

    if (limit) {
      query.limit(limit);
    }

    const predictions = await query.getMany();
    const totalFinalized = predictions.length;

    let queued = 0;
    let alreadyProcessed = 0;

    for (const prediction of predictions) {
      // Check if already processed
      const existingResult = await this.scoringService.getResult(prediction.id);

      if (existingResult && !reprocess) {
        alreadyProcessed++;
        continue;
      }

      // Process prediction
      await this.scoringService.processPrediction(prediction);
      queued++;

      // Log progress every 100 predictions
      if (queued % 100 === 0) {
        this.logger.log(`Processed ${queued} predictions...`);
      }
    }

    this.logger.log(
      `Processing complete: ${queued} processed, ${alreadyProcessed} skipped`,
    );

    return {
      queued,
      already_processed: alreadyProcessed,
      total_finalized: totalFinalized,
    };
  }

  /**
   * Get processing status
   */
  async getProcessingStatus(): Promise<{
    total_predictions: number;
    finalized_predictions: number;
    processed_predictions: number;
    pending_predictions: number;
    average_score: number;
    score_distribution: any;
  }> {
    const totalPredictions = await this.predictionRepository.count();
    const finalizedPredictions = await this.predictionRepository.count({
      where: { is_finalized: true },
    });
    const processedPredictions = await this.resultRepository.count();
    const pendingPredictions = finalizedPredictions - processedPredictions;

    const stats = await this.scoringService.getStatistics();

    return {
      total_predictions: totalPredictions,
      finalized_predictions: finalizedPredictions,
      processed_predictions: processedPredictions,
      pending_predictions: Math.max(0, pendingPredictions),
      average_score: stats.average_score,
      score_distribution: stats.score_distribution,
    };
  }
}
