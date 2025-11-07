export interface SmsIrConfig {
  apiUrl: string;
  apiKey: string;
  templateId: number;
  sandbox: boolean;
}

export interface SmsIrSendRequest {
  mobile: string;
  templateId: number;
  parameters: Array<{
    name: string;
    value: string;
  }>;
}

export interface SmsIrResponse {
  status: number;
  message: string;
  data: {
    messageId: number;
    cost: number;
  } | null;
}

export enum SmsIrStatus {
  SUCCESS = 1,
  INVALID_API_KEY = 101,
  INVALID_TEMPLATE = 103,
  INVALID_MOBILE = 104,
  INSUFFICIENT_CREDIT = 105,
  SERVER_ERROR = 500,
}
