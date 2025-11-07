// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { AdminController } from './admin.controller';
// import { AdminService } from './admin.service';
// import { ScoringModule } from '@modules/scoring/scoring.module';
// import { Prediction } from '@database/entities/prediction.entity';
// import { PredictionResult } from '@database/entities/prediction-result.entity';

// @Module({
//   imports: [
//     TypeOrmModule.forFeature([Prediction, PredictionResult]),
//     ScoringModule,
//   ],
//   controllers: [AdminController],
//   providers: [AdminService],
//   exports: [AdminService],
// })
// export class AdminModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ScoringModule } from '@modules/scoring/scoring.module';
import { QueueModule } from '@modules/queue/queue.module';
import { Prediction } from '@database/entities/prediction.entity';
import { PredictionResult } from '@database/entities/prediction-result.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prediction, PredictionResult]),
    ScoringModule,
    // QueueModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}