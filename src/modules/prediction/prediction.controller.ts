import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PredictionService } from './services/prediction.service';
import { SubmitPredictionDto } from './dto/submit-prediction.dto';
import { AuthGuard } from '@common/guards/auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { User } from '@database/entities/user.entity';
import { ScoringService } from '@modules/scoring/services/scoring.service';

@ApiTags('prediction')
@Controller('predictions')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class PredictionController {
  constructor(
    private readonly predictionService: PredictionService,
    private readonly scoringService: ScoringService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit or update prediction',
    description: 'Submit group predictions. Can be updated until finalized.',
  })
  @ApiResponse({
    status: 200,
    description: 'Prediction submitted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid prediction data',
  })
  async submitPrediction(
    @CurrentUser() user: User,
    @Body() submitPredictionDto: SubmitPredictionDto,
  ) {
    const prediction = await this.predictionService.submitPrediction(
      user.id,
      submitPredictionDto.groups,
    );

    return {
      success: true,
      message: 'Prediction submitted successfully',
      data: { prediction },
    };
  }

  @Post('finalize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Finalize prediction',
    description:
      'Make prediction immutable. Cannot be changed after finalization.',
  })
  @ApiResponse({
    status: 200,
    description: 'Prediction finalized successfully',
  })
  async finalizePrediction(@CurrentUser() user: User) {
    const prediction = await this.predictionService.finalizePrediction(user.id);

    return {
      success: true,
      message: 'Prediction finalized successfully',
      data: { prediction },
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user prediction',
    description: "Get current user's prediction",
  })
  @ApiResponse({
    status: 200,
    description: 'Prediction retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'No prediction found',
  })
  async getUserPrediction(@CurrentUser() user: User) {
    const prediction = await this.predictionService.getUserPrediction(user.id);

    if (!prediction) {
      return {
        success: true,
        message: 'No prediction found',
        data: { prediction: null },
      };
    }

    return {
      success: true,
      data: { prediction },
    };
  }

  @Get('result')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get prediction result',
    description: "Get scoring result for user's prediction",
  })
  @ApiResponse({
    status: 200,
    description: 'Result retrieved successfully',
  })
  async getPredictionResult(@CurrentUser() user: User) {
    const result = await this.predictionService.getUserPredictionResult(
      user.id,
    );

    if (!result) {
      return {
        success: true,
        message: 'No result found. Prediction may not be processed yet.',
        data: { result: null },
      };
    }

    return {
      success: true,
      data: { result },
    };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete prediction',
    description: 'Delete prediction (only if not finalized)',
  })
  @ApiResponse({
    status: 200,
    description: 'Prediction deleted successfully',
  })
  async deletePrediction(@CurrentUser() user: User) {
    await this.predictionService.deletePrediction(user.id);

    return {
      success: true,
      message: 'Prediction deleted successfully',
    };
  }

  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get prediction statistics',
    description: 'Get overall prediction statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStatistics() {
    const stats = await this.predictionService.getPredictionStats();

    return {
      success: true,
      data: stats,
    };
  }

  @Get('result/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get prediction result by user ID',
    description: "Returns the scoring result for a user's prediction",
  })
  @ApiResponse({
    status: 200,
    description: 'Result retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          result: {
            id: 'uuid',
            prediction_id: 'uuid',
            user_id: 'uuid',
            total_score: 100,
            details: {
              total_misplaced: 0,
              iran_correct: true,
              complete_groups: [
                'A',
                'B',
                'C',
                'D',
                'E',
                'F',
                'G',
                'H',
                'I',
                'J',
                'K',
                'L',
              ],
              partial_matches: {},
              applied_rule: 'state_1',
              score: 100,
            },
            processed_at: '2024-11-03T10:00:00Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Result not found - prediction may not be processed yet',
  })
  async getResult(@Param('userId') userId: string) {
    // Inject ScoringService in constructor first
    const result = await this.scoringService.getResultByUserId(userId);

    if (!result) {
      return {
        success: true,
        message: 'No result found. Prediction may not be processed yet.',
        data: { result: null },
      };
    }

    return {
      success: true,
      data: { result },
    };
  }

  @Get('leaderboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get leaderboard',
    description: 'Returns top predictions by score',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of results to return',
    example: 100,
  })
  @ApiResponse({
    status: 200,
    description: 'Leaderboard retrieved successfully',
  })
  async getLeaderboard(@Query('limit') limit?: number) {
    const leaderboard = await this.scoringService.getLeaderboard(limit || 100);

    return {
      success: true,
      data: {
        leaderboard,
        total: leaderboard.length,
      },
    };
  }
}
