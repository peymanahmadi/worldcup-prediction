import {
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('trigger-prediction-process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger prediction processing',
    description:
      'Process all finalized predictions and calculate scores. This will queue predictions for processing.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reprocess: {
          type: 'boolean',
          description: 'Reprocess already scored predictions',
          default: false,
        },
        limit: {
          type: 'number',
          description: 'Limit number of predictions to process',
          default: null,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Processing triggered successfully',
    schema: {
      example: {
        success: true,
        message: 'Processing triggered for 100 predictions',
        data: {
          queued: 100,
          already_processed: 50,
          total_finalized: 150,
        },
      },
    },
  })
  async triggerProcessing(
    @Body() body: { reprocess?: boolean; limit?: number },
  ) {
    const result = await this.adminService.triggerPredictionProcessing(
      body.reprocess || false,
      body.limit,
    );

    return {
      success: true,
      message: `Processing triggered for ${result.queued} predictions`,
      data: result,
    };
  }

  @Get('processing-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get processing status',
    description: 'Returns statistics about prediction processing',
  })
  @ApiResponse({
    status: 200,
    description: 'Status retrieved successfully',
  })
  async getProcessingStatus() {
    const status = await this.adminService.getProcessingStatus();

    return {
      success: true,
      data: status,
    };
  }
}
