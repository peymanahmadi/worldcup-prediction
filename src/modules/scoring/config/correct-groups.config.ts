/**
 * Correct World Cup 2026 Groups
 * This is the ground truth that predictions will be compared against
 * Update this when actual groups are announced
 */

export const IRAN_TEAM_ID = 'bf5556ec-a78d-4047-a0f5-7b34b07c21aa';

export interface CorrectGroupsConfig {
  version: number;
  lastUpdated: Date;
  groups: {
    [key: string]: string[];
  };
}

/**
 * CORRECT GROUPS - Update this with actual World Cup groups
 * For now, this is a sample configuration for testing
 */
export const CORRECT_GROUPS: CorrectGroupsConfig = {
  version: 1,
  lastUpdated: new Date('2024-11-03'),
  groups: {
    A: [
      'ab2fc597-2155-4b63-b61f-2a1164d596d0', // Mexico
      '4aa49644-8e88-4606-95c7-283074ebd555', // Morocco
      '6febc182-cc6d-4ee7-88c9-349643f17ab2', // Egypt
      '91fb96c3-1b47-4d6a-bd56-9dedebf29307', // Tunisia
    ],
    B: [
      '4d1e764a-3605-4983-88e9-55cca2ff8bd2', // Canada
      'c7adb883-2fee-4160-9a9c-8b8d25f80681', // Nigeria
      'bb0e3411-c9cb-4d7b-989a-85e66da231ce', // Senegal
      '5e4b6cb2-d345-4dc8-b248-cc2f1b4314c8', // Ghana
    ],
    C: [
      'e09bbfe5-1838-499b-8179-c8145d9aa211', // Colombia
      '9aaf0485-4d98-4565-b61b-ff5827d50af4', // Ecuador
      '1f02004d-a219-4742-9b32-7a610f0be53f', // Philippines
      'ebf44aab-c0c8-4f3c-9d4b-2a1da10bc426', // India
    ],
    D: [
      '5c1824ec-16dd-4e19-a891-78aa360cab1f', // United States
      '295c02f8-1d5b-458b-9fca-53cc96804bb0', // Australia
      'a7cbdde6-f6be-4da6-a41f-342d6e2aaac1', // Croatia
      '455dde8b-3e0e-4190-84cc-8de44f0f04eb', // Italy
    ],
    E: [
      '9369a23e-7905-4d34-a477-3b092846ffd3', // Portugal
      '57ef44a7-8c6f-4276-a34d-e2a275a450e0', // Brazil
      'a24dd484-f24d-45ce-9186-f2c6b746b75e', // Chile
      'f9c2ddd2-b1db-4452-919e-873fdab685b1', // Belgium
    ],
    F: [
      'bf5556ec-a78d-4047-a0f5-7b34b07c21aa', // Iran ← Special team
      '72bd98c9-c7c5-43ef-8495-1d4a08632dc8', // Switzerland
      '2a0504f4-0633-456d-86a5-19aab0f05b09', // Sweden
      'e6a15144-fa72-41c7-8b25-a96c85f10be1', // Norway
    ],
    G: [
      '86bcb8c4-68fe-4323-a478-02461ce2c2d1', // Denmark
      '9ba65926-3b5d-4a2e-85ee-9ae2cf20f86c', // Finland
      'ae863984-2ec7-40cd-97bb-b771d17a8bd7', // Poland
      '4c747601-010c-4139-bfcd-e5351495c66d', // Austria
    ],
    H: [
      'a47bf240-fd3b-49fe-bde3-80ff6738286a', // Greece
      'ee97c1d4-c027-465d-bed8-a1e511598c93', // Czech Republic
      'c9d1fd0f-3a03-4790-9be4-f28a70f2cf76', // Hungary
      '59d50cb6-077f-4754-bcb5-a603f50d76cd', // Russia
    ],
    I: [
      'd94a6cf6-6303-48b0-a850-23da1594499d', // Ukraine
      'ffcf0c31-3be9-48c9-a477-3472a5f49d31', // China
      '77cc97d5-ff3f-48ff-84e1-70b2128b017f', // South Korea
      '7bffa03e-8eb3-4b21-b03c-407c8f841c99', // Saudi Arabia
    ],
    J: [
      '29a3ca1a-cfc3-43fa-995d-eb94b27ee0ec', // UAE
      '46dbd242-5fd3-437f-b3ee-9e6083456760', // Qatar
      'b1e78534-de48-4eb5-b144-662f54dfb0e4', // Turkey
      'f50007b3-0ba7-41cd-bd18-e6cd36776487', // Uruguay
    ],
    K: [
      '8f6af8b1-11aa-433c-9d45-7dd2d2b5a650', // England
      'a3cd8425-5068-4b23-92ae-51c1b7a03412', // Spain
      'ac2a6ea5-e555-4582-a4b8-5161e6a3bbe2', // Germany
      '5ebf6e44-1b33-4572-936c-4a98730e08a7', // Uzbekistan
    ],
    L: [
      '4f63f7f1-3e1d-424f-a4ff-ed02534ff884', // Argentina
      '3a49f921-7a07-4316-8efa-923ff81947db', // New Zealand
      '9d523655-b455-469d-b6e8-e4caf1790c6d', // Japan
      '0cfbaa71-24eb-484b-8051-db6e61f55953', // PlayOff
    ],
  },
};

/**
 * Get flattened list of all team IDs in correct groups
 */
export function getCorrectTeamsList(): string[] {
  return Object.values(CORRECT_GROUPS.groups).flat();
}

/**
 * Get the correct group for a team
 */
export function getTeamCorrectGroup(teamId: string): string | null {
  for (const [group, teams] of Object.entries(CORRECT_GROUPS.groups)) {
    if (teams.includes(teamId)) {
      return group;
    }
  }
  return null;
}

/**
 * Check if Iran is in correct group in user's prediction
 */
export function isIranInCorrectGroup(userPrediction: {
  [key: string]: string[][];
}): boolean {
  const iranCorrectGroup = getTeamCorrectGroup(IRAN_TEAM_ID);

  if (!iranCorrectGroup) {
    return false;
  }

  // Check if Iran exists in the correct group in user's prediction
  const userGroupForIran = userPrediction[iranCorrectGroup];

  if (!userGroupForIran) {
    return false;
  }

  // Flatten nested arrays and check
  const flatUserGroup = userGroupForIran.flat();
  return flatUserGroup.includes(IRAN_TEAM_ID);
}
