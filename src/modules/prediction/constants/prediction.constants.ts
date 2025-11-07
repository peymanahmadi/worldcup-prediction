export const PREDICTION_CONSTANTS = {
  TOTAL_GROUPS: 12,
  TEAMS_PER_GROUP: 4,
  TOTAL_TEAMS: 48,
  GROUP_NAMES: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],

  // Iran team UUID for special scoring
  IRAN_TEAM_ID: 'bf5556ec-a78d-4047-a0f5-7b34b07c21aa',
};

export const SCORING_STATES = {
  STATE_1: {
    points: 100,
    description: 'All 48 teams in correct groups',
  },
  STATE_2: {
    points: 80,
    description: 'Only 2 teams misplaced',
  },
  STATE_3: {
    points: 60,
    description: 'Only 3 teams misplaced',
  },
  STATE_4: {
    points: 50,
    description: 'Iran team in correct group (all groups)',
  },
  STATE_5: {
    points: 40,
    description: 'One complete group correct (4 teams)',
  },
  STATE_6: {
    points: 20,
    description: '3 teams from one group correct',
  },
};
