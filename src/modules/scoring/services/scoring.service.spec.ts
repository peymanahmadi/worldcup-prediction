import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScoringService } from './scoring.service';
import { PredictionResult } from '../../../database/entities/prediction-result.entity';
import { Prediction } from '../../../database/entities/prediction.entity';
import { CORRECT_GROUPS, IRAN_TEAM_ID } from '../config/correct-groups.config';

describe('ScoringService', () => {
  let service: ScoringService;
  let repository: jest.Mocked<Repository<PredictionResult>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoringService,
        {
          provide: getRepositoryToken(PredictionResult),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ScoringService>(ScoringService);
    repository = module.get(getRepositoryToken(PredictionResult));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateScore', () => {
    it('should give 100 points for perfect prediction (State 1)', () => {
      const prediction = {
        id: 'test-id',
        user_id: 'user-id',
        predict: {},
        is_finalized: true,
        submitted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        user: null,
        results: [],
      } as unknown as Prediction;

      // Create perfect prediction
      const perfectGroups: any = {};
      for (const [group, teams] of Object.entries(CORRECT_GROUPS.groups)) {
        perfectGroups[group] = teams.map((t) => [t]);
      }
      prediction.predict = perfectGroups;

      const result = service.calculateScore(prediction);

      expect(result.score).toBe(100);
      expect(result.applied_rule).toBe('state_1');
      expect(result.total_misplaced).toBe(0);
      expect(result.iran_correct).toBe(true);
    });

    it('should give 80 points for 2 teams wrong (State 2)', () => {
      const prediction = {
        id: 'test-id',
        user_id: 'user-id',
        predict: {},
        is_finalized: true,
        submitted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        user: null,
        results: [],
      } as unknown as Prediction;

      // Create prediction with 2 teams swapped
      const groups: any = {};
      for (const [group, teams] of Object.entries(CORRECT_GROUPS.groups)) {
        groups[group] = teams.map((t) => [t]);
      }

      // Swap 2 teams between A and B
      const temp = groups.A[0];
      groups.A[0] = groups.B[0];
      groups.B[0] = temp;

      prediction.predict = groups;

      const result = service.calculateScore(prediction);

      expect(result.score).toBe(80);
      expect(result.applied_rule).toBe('state_2');
      expect(result.total_misplaced).toBe(2);
    });

    it('should give 60 points for 3 teams wrong (State 3)', () => {
      const prediction = {
        id: 'test-id',
        user_id: 'user-id',
        predict: {},
        is_finalized: true,
        submitted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        user: null,
        results: [],
      } as unknown as Prediction;

      // Create prediction with 3 teams swapped
      const groups: any = {};
      for (const [group, teams] of Object.entries(CORRECT_GROUPS.groups)) {
        groups[group] = teams.map((t) => [t]);
      }

      // Swap 3 teams
      const temp1 = groups.A[0];
      const temp2 = groups.B[0];
      groups.A[0] = groups.C[0];
      groups.B[0] = temp1;
      groups.C[0] = temp2;

      prediction.predict = groups;

      const result = service.calculateScore(prediction);

      expect(result.score).toBe(60);
      expect(result.applied_rule).toBe('state_3');
      expect(result.total_misplaced).toBe(3);
    });

    it('should give 50 points when Iran is correct (State 4)', () => {
      const prediction = {
        id: 'test-id',
        user_id: 'user-id',
        predict: {},
        is_finalized: true,
        submitted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        user: null,
        results: [],
      } as unknown as Prediction;

      // Create prediction with Iran correct but many teams wrong
      const groups: any = {};
      for (const [group, teams] of Object.entries(CORRECT_GROUPS.groups)) {
        groups[group] = teams.map((t) => [t]);
      }

      // Keep Iran in F (correct), but mess up others (>3 teams)
      const temp1 = groups.A[0];
      const temp2 = groups.B[0];
      const temp3 = groups.C[0];
      const temp4 = groups.D[0];

      groups.A[0] = temp2;
      groups.B[0] = temp3;
      groups.C[0] = temp4;
      groups.D[0] = temp1;

      prediction.predict = groups;

      const result = service.calculateScore(prediction);

      expect(result.score).toBe(50);
      expect(result.applied_rule).toBe('state_4');
      expect(result.iran_correct).toBe(true);
      expect(result.total_misplaced).toBeGreaterThan(3);
    });

    it('should give 40 points for one complete group (State 5)', () => {
      const prediction = {
        id: 'test-id',
        user_id: 'user-id',
        predict: {},
        is_finalized: true,
        submitted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        user: null,
        results: [],
      } as unknown as Prediction;

      // Keep group A correct, mess up all others
      // Strategy: Swap teams between B, C, D to create >3 misplaced teams
      // but ensure group A stays perfect
      const groups: any = {};

      for (const [group, teams] of Object.entries(CORRECT_GROUPS.groups)) {
        if (group === 'A') {
          // Keep A perfect
          groups[group] = teams.map((t) => [t]);
        } else if (group === 'B') {
          // Swap B's teams with C's teams
          groups[group] = CORRECT_GROUPS.groups.C.map((t) => [t]);
        } else if (group === 'C') {
          // Swap C's teams with D's teams
          groups[group] = CORRECT_GROUPS.groups.D.map((t) => [t]);
        } else if (group === 'D') {
          // Swap D's teams with B's teams
          groups[group] = CORRECT_GROUPS.groups.B.map((t) => [t]);
        } else {
          // For other groups, swap with next group
          const groupKeys = Object.keys(CORRECT_GROUPS.groups);
          const currentIndex = groupKeys.indexOf(group);
          const nextIndex = (currentIndex + 1) % groupKeys.length;
          const nextGroup = groupKeys[nextIndex];
          if (nextGroup !== 'A') {
            groups[group] = CORRECT_GROUPS.groups[nextGroup].map((t) => [t]);
          } else {
            groups[group] = teams.map((t) => [t]);
          }
        }
      }

      // Ensure Iran is NOT in correct group (F) to avoid State 4
      const iranTeamId = 'bf5556ec-a78d-4047-a0f5-7b34b07c21aa';
      // If Iran is still in F, move it to B
      if (groups.F.some((t: string[]) => t[0] === iranTeamId)) {
        const iranIndex = groups.F.findIndex(
          (t: string[]) => t[0] === iranTeamId,
        );
        // Swap with first team from group B
        const temp = groups.F[iranIndex];
        groups.F[iranIndex] = groups.B[0];
        groups.B[0] = temp;
      }

      prediction.predict = groups;

      const result = service.calculateScore(prediction);

      expect(result.score).toBe(40);
      expect(result.applied_rule).toBe('state_5');
      expect(result.complete_groups).toContain('A');
      expect(result.complete_groups.length).toBeGreaterThanOrEqual(1);
    });

    it('should give 20 points for 3 teams in one group (State 6)', () => {
      const prediction = {
        id: 'test-id',
        user_id: 'user-id',
        predict: {},
        is_finalized: true,
        submitted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        user: null,
        results: [],
      } as unknown as Prediction;

      // Keep 3 teams in group A correct, swap 1
      // Strategy: Ensure no complete groups, but A has 3 correct teams
      const groups: any = {};
      const allTeamIds = Object.values(CORRECT_GROUPS.groups).flat();

      for (const [group, teams] of Object.entries(CORRECT_GROUPS.groups)) {
        if (group === 'A') {
          // Keep first 3 teams correct, swap the 4th with a team from B
          groups[group] = [
            [teams[0]], // Correct
            [teams[1]], // Correct
            [teams[2]], // Correct
            [CORRECT_GROUPS.groups.B[0]], // Wrong - from group B
          ];
        } else {
          // For all other groups, use teams from completely different groups
          // to ensure no complete groups exist
          const wrongTeams: string[] = [];
          let offset =
            group === 'B' ? 4 : group.charCodeAt(0) - 'A'.charCodeAt(0) + 8;

          for (let i = 0; i < 4; i++) {
            // Pick teams that definitely don't belong to this group
            // Use a different offset for each group to avoid creating complete groups
            const teamIdx = (offset + i * 7) % allTeamIds.length;
            let wrongTeam = allTeamIds[teamIdx];

            // Make sure it's not from the correct group
            let attempts = 0;
            while (teams.includes(wrongTeam) && attempts < 10) {
              offset++;
              const newIdx = (offset + i * 7) % allTeamIds.length;
              wrongTeam = allTeamIds[newIdx];
              attempts++;
            }

            wrongTeams.push(wrongTeam);
          }
          groups[group] = wrongTeams.map((t) => [t]);
        }
      }

      // Ensure Iran is NOT in correct group (F) to avoid State 4 (50 points)
      const iranTeamId = 'bf5556ec-a78d-4047-a0f5-7b34b07c21aa';
      // If Iran is in F, move it to another group
      if (groups.F && groups.F.some((t: string[]) => t[0] === iranTeamId)) {
        const iranIndex = groups.F.findIndex(
          (t: string[]) => t[0] === iranTeamId,
        );
        // Swap with first team from group B
        const temp = groups.F[iranIndex];
        groups.F[iranIndex] = groups.B[0];
        groups.B[0] = temp;
      }

      prediction.predict = groups;

      const result = service.calculateScore(prediction);

      expect(result.score).toBe(20);
      expect(result.applied_rule).toBe('state_6');
      expect(Object.keys(result.partial_matches).length).toBeGreaterThan(0);
    });

    it('should give 0 points for no matches', () => {
      const prediction = {
        id: 'test-id',
        user_id: 'user-id',
        predict: {},
        is_finalized: true,
        submitted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        user: null,
        results: [],
      } as unknown as Prediction;

      // Completely random/wrong prediction
      const groups: any = {};
      const allTeams = Object.values(CORRECT_GROUPS.groups).flat();

      // Reverse all teams
      const reversed = [...allTeams].reverse();
      const groupKeys = Object.keys(CORRECT_GROUPS.groups);

      for (let i = 0; i < groupKeys.length; i++) {
        const start = i * 4;
        groups[groupKeys[i]] = reversed.slice(start, start + 4).map((t) => [t]);
      }

      prediction.predict = groups;

      const result = service.calculateScore(prediction);

      expect(result.score).toBe(0);
      expect(result.applied_rule).toBe('no_match');
    });
  });
});
