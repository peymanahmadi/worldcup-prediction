export const TOKEN_CONSTANTS = {
  // Token configuration
  TOKEN_LENGTH: 64, // characters
  TOKEN_EXPIRY_DAYS: 30, // 30 days

  // Redis cache
  CACHE_PREFIX: 'session:token:',
  CACHE_TTL: 3600, // 1 hour cache for active sessions

  // Bcrypt
  BCRYPT_ROUNDS: 12,
};
