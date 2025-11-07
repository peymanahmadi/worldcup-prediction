import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from '@database/entities/team.entity';
import { TeamSeeder } from '@database/seeds/team.seeder';

@Module({
  imports: [TypeOrmModule.forFeature([Team])],
  providers: [TeamService, TeamSeeder],
  controllers: [TeamController],
  exports: [TeamService, TeamSeeder],
})
export class TeamModule {}
