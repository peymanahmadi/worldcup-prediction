import { ApiProperty } from '@nestjs/swagger';

export class TeamDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'ایران' })
  fa_name: string;

  @ApiProperty({ example: 'Iran' })
  eng_name: string;

  @ApiProperty({ example: 1 })
  order: number;

  @ApiProperty({ example: 'E', nullable: true })
  group: string | null;

  @ApiProperty({ example: '🇮🇷' })
  flag: string;
}

export class TeamsByGroupDto {
  @ApiProperty({ example: 'A' })
  group: string;

  @ApiProperty({ type: [TeamDto] })
  teams: TeamDto[];
}
