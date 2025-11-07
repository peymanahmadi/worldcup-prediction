import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScoringService } from './services/scoring.service';
import { PredictionResult } from '../../database/entities/prediction-result.entity';
import { Prediction } from '../../database/entities/prediction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PredictionResult, Prediction])],
  providers: [ScoringService],
  exports: [ScoringService],
})
export class ScoringModule {}
