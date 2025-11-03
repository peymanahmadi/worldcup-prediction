export const OTP_CONSTANTS = {
  // TTL in seconds
  OTP_TTL: 120, // 2 minutes
  SEND_LIMIT_TTL: 120, // 2 minutes
  VERIFY_ATTEMPTS_TTL: 60, // 1 minute

  // Limits
  MAX_VERIFY_ATTEMPTS: 5,
  OTP_LENGTH: 6,

  // Redis key prefixes
  KEY_PREFIX: {
    OTP: 'otp:phone:',
    SEND_LIMIT: 'otp:send:limit:',
    VERIFY_ATTEMPTS: 'otp:verify:attempts:',
  },

  // Error messages
  ERRORS: {
    SEND_LIMIT_EXCEEDED: 'You can request OTP only once every 2 minutes',
    VERIFY_LIMIT_EXCEEDED:
      'Too many verification attempts. Please request a new OTP',
    OTP_EXPIRED: 'OTP has expired. Please request a new one',
    OTP_INVALID: 'Invalid OTP code',
    OTP_NOT_FOUND: 'No OTP found. Please request one first',
  },
};
