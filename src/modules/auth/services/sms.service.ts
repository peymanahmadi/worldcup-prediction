import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import {
  SmsIrConfig,
  SmsIrSendRequest,
  SmsIrResponse,
  SmsIrStatus,
} from '../interfaces/sms.interface';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly config: SmsIrConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      apiUrl: this.configService.getOrThrow<string>('app.sms.apiUrl'),
      apiKey: this.configService.getOrThrow<string>('app.sms.apiKey'),
      templateId: this.configService.getOrThrow<number>('app.sms.templateId'),
      sandbox: this.configService.getOrThrow<boolean>('app.sms.sandbox'),
    };

    this.logger.log(
      `SMS Service initialized (Sandbox: ${this.config.sandbox})`,
    );
  }

  /**
   * Send OTP via SMS.ir
   */
  async sendOtp(phone: string, code: string): Promise<SmsIrResponse> {
    try {
      // Remove leading zero if exists and add country code
      const mobile = this.formatPhoneNumber(phone);

      this.logger.log(`Sending OTP to ${mobile} (Original: ${phone})`);

      // Prepare request
      const requestData: SmsIrSendRequest = {
        mobile,
        templateId: this.config.templateId,
        parameters: [
          {
            name: 'Code',
            value: code,
          },
        ],
      };

      // Send request to SMS.ir
      const response = await axios.post<SmsIrResponse>(
        this.config.apiUrl,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/plain',
            'x-api-key': this.config.apiKey,
          },
          timeout: 10000, // 10 second timeout
        },
      );

      // Check response status
      if (response.data.status === SmsIrStatus.SUCCESS) {
        this.logger.log(
          `✅ SMS sent successfully to ${mobile}. MessageId: ${response.data.data?.messageId}, Cost: ${response.data.data?.cost}`,
        );
      } else {
        this.logger.warn(
          `⚠️ SMS.ir returned non-success status: ${response.data.status} - ${response.data.message}`,
        );
      }

      return response.data;
    } catch (error) {
      return this.handleSmsError(error, phone);
    }
  }

  /**
   * Format phone number for SMS.ir
   * SMS.ir expects: 91xxxxxxxxx (without leading 0, with country code 98)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any spaces or special characters
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // If starts with 0, remove it
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // If starts with +98, remove it
    if (cleaned.startsWith('+98')) {
      cleaned = cleaned.substring(3);
    }

    // If starts with 98, remove it
    if (cleaned.startsWith('98')) {
      cleaned = cleaned.substring(2);
    }

    // Should now be 9xxxxxxxxx (10 digits starting with 9)
    if (!cleaned.startsWith('9') || cleaned.length !== 10) {
      this.logger.warn(`Invalid phone format after cleaning: ${cleaned}`);
    }

    return cleaned;
  }

  /**
   * Handle SMS errors
   */
  private handleSmsError(error: any, phone: string): SmsIrResponse {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<SmsIrResponse>;

      if (axiosError.response) {
        // Server responded with error
        const errorData = axiosError.response.data;

        this.logger.error(
          `SMS.ir API error for ${phone}: Status ${errorData.status} - ${errorData.message}`,
        );

        // Log specific error types
        switch (errorData.status) {
          case SmsIrStatus.INVALID_API_KEY:
            this.logger.error(
              '❌ Invalid API Key! Check your SMS.ir credentials.',
            );
            break;
          case SmsIrStatus.INVALID_TEMPLATE:
            this.logger.error(
              '❌ Invalid Template ID! Check your template configuration.',
            );
            break;
          case SmsIrStatus.INVALID_MOBILE:
            this.logger.error(`❌ Invalid mobile number: ${phone}`);
            break;
          case SmsIrStatus.INSUFFICIENT_CREDIT:
            this.logger.error('❌ Insufficient credit in SMS.ir account!');
            break;
          default:
            this.logger.error(`❌ Unknown SMS.ir error: ${errorData.status}`);
        }

        return errorData;
      } else if (axiosError.request) {
        // Request made but no response
        this.logger.error(
          `No response from SMS.ir API for ${phone}:`,
          axiosError.message,
        );
      } else {
        // Error in request setup
        this.logger.error(
          `Error setting up SMS request for ${phone}:`,
          axiosError.message,
        );
      }
    } else {
      this.logger.error(`Unexpected error sending SMS to ${phone}:`, error);
    }

    // Return error response
    return {
      status: SmsIrStatus.SERVER_ERROR,
      message: 'Failed to send SMS',
      data: null,
    };
  }

  /**
   * Validate SMS.ir response
   */
  isSuccessResponse(response: SmsIrResponse): boolean {
    return response.status === SmsIrStatus.SUCCESS && response.data !== null;
  }

  /**
   * Get error message in Persian
   */
  getErrorMessage(status: number): string {
    const messages: { [key: number]: string } = {
      101: 'کلید API نامعتبر است',
      103: 'شناسه الگو نامعتبر است',
      104: 'شماره موبایل نامعتبر است',
      105: 'اعتبار حساب کافی نیست',
      500: 'خطای سرور',
    };

    return messages[status] || 'خطای نامشخص';
  }
}
