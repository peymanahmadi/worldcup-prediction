import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as amqp from 'amqplib';
import { QueueService } from './queue.service';
import { ScoringService } from '@modules/scoring/services/scoring.service';
import { Prediction } from '@database/entities/prediction.entity';

@Injectable()
export class QueueWorkerService implements OnModuleInit {
  private readonly logger = new Logger(QueueWorkerService.name);
  private isProcessing = false;
  private processedCount = 0;
  private errorCount = 0;
  private readonly BATCH_SIZE = 1000;

  constructor(
    private readonly queueService: QueueService,
    private readonly scoringService: ScoringService,
    @InjectRepository(Prediction)
    private readonly predictionRepository: Repository<Prediction>,
  ) {}

  async onModuleInit() {
    // Wait for queue service to connect, then start worker
    await this.startWorker();
  }

  /**
   * Start consuming messages from queue
   */
  async startWorker(): Promise<void> {
    if (this.isProcessing) {
      this.logger.warn('Worker already running');
      return;
    }

    this.logger.log('Starting queue worker...');

    try {
      // Wait for queue service to be connected
      this.logger.log('Waiting for queue connection...');
      await this.queueService.waitForConnection(10000); // Wait up to 10 seconds

      if (!this.queueService.isConnected()) {
        this.logger.warn('RabbitMQ not available. Worker will not start.');
        this.logger.warn(
          'Queue worker is disabled. Start RabbitMQ to enable queue processing.',
        );
        return;
      }

      this.logger.log('Queue connection established');

      this.isProcessing = true;
      const channel = this.queueService.getChannel();
      const queueName = this.queueService.getQueueName();

      await channel.consume(
        queueName,
        async (msg) => {
          if (!msg) {
            return;
          }

          try {
            await this.processMessage(msg, channel);
          } catch (error) {
            this.logger.error('Error in message handler:', error);
            // Reject and send to DLQ
            channel.nack(msg, false, false);
          }
        },
        {
          noAck: false, // Manual acknowledgment
        },
      );

      this.logger.log('✅ Worker started and listening for messages');
    } catch (error) {
      this.logger.error('Failed to start worker:', error);
      this.isProcessing = false;
      throw error;
    }
  }

  /**
   * Process individual message
   */
  private async processMessage(
    msg: amqp.ConsumeMessage,
    channel: amqp.Channel,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const content = JSON.parse(msg.content.toString());
      const { predictionId, userId } = content;

      this.logger.debug(`Processing prediction ${predictionId}`);

      // Get prediction from database
      const prediction = await this.predictionRepository.findOne({
        where: { id: predictionId },
      });

      if (!prediction) {
        this.logger.warn(`Prediction ${predictionId} not found`);
        channel.ack(msg); // Acknowledge and discard
        return;
      }

      // Check if already processed
      const existingResult = await this.scoringService.getResult(predictionId);

      if (existingResult) {
        this.logger.debug(`Prediction ${predictionId} already processed`);
        channel.ack(msg);
        return;
      }

      // Process prediction
      await this.scoringService.processPrediction(prediction);

      // Acknowledge message
      channel.ack(msg);

      this.processedCount++;
      const duration = Date.now() - startTime;

      this.logger.debug(
        `✅ Processed prediction ${predictionId} in ${duration}ms (Total: ${this.processedCount})`,
      );

      // Log progress every 100 predictions
      if (this.processedCount % 100 === 0) {
        this.logger.log(
          `Progress: ${this.processedCount} processed, ${this.errorCount} errors`,
        );
      }
    } catch (error) {
      this.errorCount++;
      this.logger.error('Error processing message:', error);

      // Check retry count
      const retryCount =
        (msg.properties.headers?.['x-retry-count'] as number) || 0;

      if (retryCount < 3) {
        // Retry: Reject and requeue
        this.logger.log(`Retrying message (attempt ${retryCount + 1}/3)`);

        channel.nack(msg, false, true); // Requeue
      } else {
        // Max retries reached: Send to DLQ
        this.logger.error('Max retries reached, sending to DLQ');
        channel.nack(msg, false, false); // Don't requeue, goes to DLQ
      }
    }
  }

  /**
   * Stop worker
   */
  stopWorker(): void {
    this.isProcessing = false;
    this.logger.log('Worker stopped');
  }

  /**
   * Get worker statistics
   */
  getStats(): {
    isProcessing: boolean;
    processedCount: number;
    errorCount: number;
  } {
    return {
      isProcessing: this.isProcessing,
      processedCount: this.processedCount,
      errorCount: this.errorCount,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.processedCount = 0;
    this.errorCount = 0;
    this.logger.log('Stats reset');
  }
}
