import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private readonly queueName = 'prediction.process';
  private readonly dlqName = 'prediction.process.dlq';

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * Connect to RabbitMQ
   */
  async connect(): Promise<void> {
    try {
      const rabbitmqUrl = this.configService.get<string>('rabbitmq.url');
      if (!rabbitmqUrl) {
        this.logger.warn(
          'RabbitMQ URL is not configured. Queue functionality will be disabled.',
        );
        return;
      }

      this.connection = (await amqp.connect(rabbitmqUrl)) as any;
      this.channel = await (this.connection as any).createChannel();

      if (!this.channel) {
        this.logger.warn(
          'Failed to create channel. Queue functionality will be disabled.',
        );
        return;
      }

      // Create Dead Letter Queue
      await this.channel.assertQueue(this.dlqName, {
        durable: true,
      });

      // Create main queue with DLQ configuration
      await this.channel.assertQueue(this.queueName, {
        durable: true,
        deadLetterExchange: '',
        deadLetterRoutingKey: this.dlqName,
      });

      // Set prefetch to process messages one at a time
      await this.channel.prefetch(10);

      this.logger.log('Connected to RabbitMQ');
      this.logger.log(`Queue: ${this.queueName}`);
      this.logger.log(`DLQ: ${this.dlqName}`);
    } catch (error) {
      this.logger.warn(
        'Failed to connect to RabbitMQ. Queue functionality will be disabled.',
      );
      this.logger.warn(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Don't throw - allow app to continue without RabbitMQ
      this.connection = null;
      this.channel = null;
    }
  }

  /**
   * Disconnect from RabbitMQ
   */
  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await (this.connection as any).close();
      }
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  /**
   * Publish prediction ID to queue
   */
  async publishPrediction(
    predictionId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      if (!this.channel) {
        this.logger.warn(
          `Cannot publish prediction ${predictionId}: RabbitMQ not connected`,
        );
        return false;
      }

      const message = {
        predictionId,
        userId,
        timestamp: Date.now(),
        priority: 'normal',
      };

      const sent = this.channel.sendToQueue(
        this.queueName,
        Buffer.from(JSON.stringify(message)),
        {
          persistent: true, // Message survives broker restart
          contentType: 'application/json',
        },
      );

      if (sent) {
        this.logger.debug(`Published prediction ${predictionId} to queue`);
      }

      return sent;
    } catch (error) {
      this.logger.error(`Error publishing prediction ${predictionId}:`, error);
      return false;
    }
  }

  /**
   * Publish multiple predictions in batch
   */
  async publishBatch(
    predictions: Array<{ id: string; user_id: string }>,
  ): Promise<number> {
    let successCount = 0;

    for (const prediction of predictions) {
      const success = await this.publishPrediction(
        prediction.id,
        prediction.user_id,
      );
      if (success) {
        successCount++;
      }
    }

    this.logger.log(
      `Published ${successCount}/${predictions.length} predictions to queue`,
    );
    return successCount;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    queueName: string;
    messageCount: number;
    consumerCount: number;
  }> {
    try {
      if (!this.channel) {
        this.logger.warn('Cannot get queue stats: RabbitMQ not connected');
        return {
          queueName: this.queueName,
          messageCount: 0,
          consumerCount: 0,
        };
      }
      const queueInfo = await this.channel.checkQueue(this.queueName);

      return {
        queueName: this.queueName,
        messageCount: queueInfo.messageCount,
        consumerCount: queueInfo.consumerCount,
      };
    } catch (error) {
      this.logger.error('Error getting queue stats:', error);
      return {
        queueName: this.queueName,
        messageCount: 0,
        consumerCount: 0,
      };
    }
  }

  /**
   * Get DLQ statistics
   */
  async getDLQStats(): Promise<{
    queueName: string;
    messageCount: number;
  }> {
    try {
      if (!this.channel) {
        this.logger.warn('Cannot get DLQ stats: RabbitMQ not connected');
        return {
          queueName: this.dlqName,
          messageCount: 0,
        };
      }
      const queueInfo = await this.channel.checkQueue(this.dlqName);

      return {
        queueName: this.dlqName,
        messageCount: queueInfo.messageCount,
      };
    } catch (error) {
      this.logger.error('Error getting DLQ stats:', error);
      return {
        queueName: this.dlqName,
        messageCount: 0,
      };
    }
  }

  /**
   * Purge queue (clear all messages)
   */
  async purgeQueue(): Promise<{ messageCount: number }> {
    try {
      if (!this.channel) {
        this.logger.warn('Cannot purge queue: RabbitMQ not connected');
        return { messageCount: 0 };
      }
      const result = await this.channel.purgeQueue(this.queueName);
      this.logger.log(`Purged ${result.messageCount} messages from queue`);
      return result;
    } catch (error) {
      this.logger.error('Error purging queue:', error);
      throw error;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }

  /**
   * Wait for connection to be established
   */
  async waitForConnection(maxWaitMs: number = 30000): Promise<void> {
    const startTime = Date.now();
    while (!this.isConnected()) {
      if (Date.now() - startTime > maxWaitMs) {
        throw new Error('Timeout waiting for queue connection');
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Get channel for worker consumption
   */
  getChannel(): amqp.Channel {
    if (!this.channel) {
      throw new Error('Channel is not initialized. Call connect() first.');
    }
    return this.channel;
  }

  /**
   * Get queue name
   */
  getQueueName(): string {
    return this.queueName;
  }
}
