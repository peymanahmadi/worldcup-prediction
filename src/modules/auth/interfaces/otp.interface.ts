export interface OtpData {
  code: string;
  expiresAt: number;
  attempts: number;
}

export interface OtpVerificationResult {
  success: boolean;
  message: string;
  remainingAttempts?: number;
}
