import { HttpException, HttpStatus } from '@nestjs/common';

export class OtpSendLimitException extends HttpException {
  constructor(message?: string) {
    super(
      {
        success: false,
        error: {
          code: 'OTP_SEND_LIMIT_EXCEEDED',
          message: message || 'You can request OTP only once every 2 minutes',
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
        },
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

export class OtpVerifyLimitException extends HttpException {
  constructor(message?: string) {
    super(
      {
        success: false,
        error: {
          code: 'OTP_VERIFY_LIMIT_EXCEEDED',
          message: message || 'Too many verification attempts',
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
        },
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

export class OtpInvalidException extends HttpException {
  constructor(remainingAttempts?: number) {
    super(
      {
        success: false,
        error: {
          code: 'OTP_INVALID',
          message: 'Invalid OTP code',
          statusCode: HttpStatus.BAD_REQUEST,
          remainingAttempts,
        },
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class OtpExpiredException extends HttpException {
  constructor() {
    super(
      {
        success: false,
        error: {
          code: 'OTP_EXPIRED',
          message: 'OTP has expired. Please request a new one',
          statusCode: HttpStatus.BAD_REQUEST,
        },
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class OtpNotFoundException extends HttpException {
  constructor() {
    super(
      {
        success: false,
        error: {
          code: 'OTP_NOT_FOUND',
          message: 'No OTP found. Please request one first',
          statusCode: HttpStatus.NOT_FOUND,
        },
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
