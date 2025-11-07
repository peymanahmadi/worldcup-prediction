import { ApiProperty } from '@nestjs/swagger';

export class PredictionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty({
    example: {
      groups: {
        A: ['uuid1', 'uuid2', 'uuid3', 'uuid4', 'uuid5', 'uuid6'],
      },
    },
  })
  predict: any;

  @ApiProperty()
  is_finalized: boolean;

  @ApiProperty()
  submitted_at: Date | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class PredictionResultDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  prediction_id: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty()
  total_score: number;

  @ApiProperty({
    example: {
      applied_rule: 'state_4',
      iran_correct: true,
      total_misplaced: 5,
      explanation: 'Iran team is in the correct group',
    },
  })
  details: any;

  @ApiProperty()
  processed_at: Date;
}
