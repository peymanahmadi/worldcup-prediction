import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prediction } from '@database/entities/prediction.entity';
import { PredictionResult } from '@database/entities/prediction-result.entity';
import { ScoringService } from '@modules/scoring/services/scoring.service';

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

// import { Injectable, Logger } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Prediction } from '@database/entities/prediction.entity';
// import { PredictionResult } from '@database/entities/prediction-result.entity';
// import { ScoringService } from '@modules/scoring/services/scoring.service';
// import { QueueService } from '@modules/queue/queue.service';
// import { QueueWorkerService } from '@modules/queue/queue-worker.service';

// @Injectable()
// export class AdminService {
//   private readonly logger = new Logger(AdminService.name);
//   private readonly BATCH_SIZE = 1000; // Publish 1000 at a time

//   constructor(
//     @InjectRepository(Prediction)
//     private readonly predictionRepository: Repository<Prediction>,
//     @InjectRepository(PredictionResult)
//     private readonly resultRepository: Repository<PredictionResult>,
//     private readonly scoringService: ScoringService,
//     private readonly queueService: QueueService,
//     private readonly queueWorkerService: QueueWorkerService,
//   ) {}

//   /**
//    * Trigger prediction processing using RabbitMQ queue
//    */
//   async triggerPredictionProcessing(
//     reprocess: boolean = false,
//     limit?: number,
//   ): Promise<{
//     queued: number;
//     already_processed: number;
//     total_finalized: number;
//     batches_published: number;
//   }> {
//     this.logger.log('Starting prediction processing with RabbitMQ queue...');

//     // Get all finalized predictions
//     const query = this.predictionRepository
//       .createQueryBuilder('prediction')
//       .where('prediction.is_finalized = :finalized', { finalized: true })
//       .orderBy('prediction.submitted_at', 'ASC');

//     if (limit) {
//       query.limit(limit);
//     }

//     const predictions = await query.getMany();
//     const totalFinalized = predictions.length;

//     let queued = 0;
//     let alreadyProcessed = 0;
//     let batchesPublished = 0;

//     // Process in batches and publish to queue
//     for (let i = 0; i < predictions.length; i += this.BATCH_SIZE) {
//       const batch = predictions.slice(i, i + this.BATCH_SIZE);

//       this.logger.log(
//         `Publishing batch ${batchesPublished + 1}: ${batch.length} predictions`,
//       );

//       const toPublish: Array<{ id: string; user_id: string }> = [];

//       for (const prediction of batch) {
//         // Check if already processed (unless reprocess is true)
//         if (!reprocess) {
//           const existingResult = await this.scoringService.getResult(
//             prediction.id,
//           );

//           if (existingResult) {
//             alreadyProcessed++;
//             continue;
//           }
//         }

//         toPublish.push({ id: prediction.id, user_id: prediction.user_id });
//       }

//       // Publish batch to queue
//       if (toPublish.length > 0) {
//         const published = await this.queueService.publishBatch(toPublish);
//         queued += published;
//       }

//       batchesPublished++;

//       this.logger.log(
//         `Batch ${batchesPublished} published. Total queued: ${queued}`,
//       );
//     }

//     this.logger.log(
//       `Processing queued: ${queued} queued, ${alreadyProcessed} skipped, ${batchesPublished} batches`,
//     );

//     return {
//       queued,
//       already_processed: alreadyProcessed,
//       total_finalized: totalFinalized,
//       batches_published: batchesPublished,
//     };
//   }

//   /**
//    * Get processing status including queue stats
//    */
//   async getProcessingStatus(): Promise<{
//     total_predictions: number;
//     finalized_predictions: number;
//     processed_predictions: number;
//     pending_predictions: number;
//     average_score: number;
//     score_distribution: any;
//     top_score: number | null;
//     lowest_score: number | null;
//     queue_stats: any;
//     worker_stats: any;
//   }> {
//     const totalPredictions = await this.predictionRepository.count();
//     const finalizedPredictions = await this.predictionRepository.count({
//       where: { is_finalized: true },
//     });
//     const processedPredictions = await this.resultRepository.count();
//     const pendingPredictions = finalizedPredictions - processedPredictions;

//     const stats = await this.scoringService.getStatistics();

//     // Get top and lowest scores
//     const topResult = await this.resultRepository.findOne({
//       order: { total_score: 'DESC' },
//     });

//     const lowestResult = await this.resultRepository.findOne({
//       order: { total_score: 'ASC' },
//     });

//     // Get queue statistics
//     const queueStats = await this.queueService.getQueueStats();
//     const dlqStats = await this.queueService.getDLQStats();
//     const workerStats = this.queueWorkerService.getStats();

//     return {
//       total_predictions: totalPredictions,
//       finalized_predictions: finalizedPredictions,
//       processed_predictions: processedPredictions,
//       pending_predictions: Math.max(0, pendingPredictions),
//       average_score: stats.average_score,
//       score_distribution: stats.score_distribution,
//       top_score: topResult?.total_score || null,
//       lowest_score: lowestResult?.total_score || null,
//       queue_stats: {
//         main_queue: queueStats,
//         dead_letter_queue: dlqStats,
//       },
//       worker_stats: workerStats,
//     };
//   }
// }