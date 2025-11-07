import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../entities/team.entity';
import { TEAMS_SEED_DATA, IRAN_TEAM_ID } from './teams.seed';

@Injectable()
export class TeamSeeder {
  private readonly logger = new Logger(TeamSeeder.name);

  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
  ) {}

  async seed(): Promise<void> {
    this.logger.log('Starting team seeding...');

    try {
      // Check if teams already exist
      const count = await this.teamRepository.count();

      if (count > 0) {
        this.logger.warn(
          `Teams already exist (${count} teams). Skipping seed.`,
        );
        return;
      }

      // Create teams with specific UUIDs where needed
      const teams = TEAMS_SEED_DATA.map((teamData) => {
        // Coerce fields to match DeepPartial<Team> typings (e.g., convert null to undefined)
        const team = this.teamRepository.create({
          ...teamData,
          order: teamData.order ?? undefined,
        });

        // Set specific UUID for Iran team
        if (teamData.id) {
          team.id = teamData.id;
        }

        return team;
      });

      // Save all teams
      await this.teamRepository.save(teams);

      this.logger.log(`✅ Successfully seeded ${teams.length} teams`);

      // Verify Iran team UUID
      const iranTeam = await this.teamRepository.findOne({
        where: { id: IRAN_TEAM_ID },
      });

      if (iranTeam) {
        this.logger.log(`✅ Iran team verified with UUID: ${IRAN_TEAM_ID}`);
      } else {
        this.logger.error('❌ Iran team UUID verification failed');
      }

      // Log group distribution
      const groupCounts = await this.teamRepository
        .createQueryBuilder('team')
        .select('team.group')
        .addSelect('COUNT(*)', 'count')
        .groupBy('team.group')
        .orderBy('team.group')
        .getRawMany();

      this.logger.log('Team distribution by group:');
      groupCounts.forEach((group) => {
        this.logger.log(`  Group ${group.team_group}: ${group.count} teams`);
      });
    } catch (error) {
      this.logger.error('Error seeding teams:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    this.logger.log('Clearing teams...');
    await this.teamRepository.delete({});
    this.logger.log('✅ Teams cleared');
  }
}
