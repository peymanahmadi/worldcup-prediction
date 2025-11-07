import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueService } from './queue.service';
import { QueueWorkerService } from './queue-worker.service';
import { ScoringModule } from '@modules/scoring/scoring.module';
import { Prediction } from '@database/entities/prediction.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Prediction]), ScoringModule],
  providers: [QueueService, QueueWorkerService],
  exports: [QueueService, QueueWorkerService],
})
export class QueueModule {}
