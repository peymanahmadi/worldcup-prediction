import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PredictionController } from './prediction.controller';
import { PredictionService } from './services/prediction.service';
import { PredictionValidationService } from './services/prediction-validation.service';
import { Prediction } from '../../database/entities/prediction.entity';
import { PredictionResult } from '../../database/entities/prediction-result.entity';
import { Team } from '../../database/entities/team.entity';
import { User } from '../../database/entities/user.entity';
import { AuthModule } from '../../modules/auth/auth.module';
import { ScoringModule } from '../../modules/scoring/scoring.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prediction, PredictionResult, Team, User]),
    AuthModule,
    ScoringModule,
  ],
  controllers: [PredictionController],
  providers: [PredictionService, PredictionValidationService],
  exports: [PredictionService, PredictionValidationService],
})
export class PredictionModule {}
