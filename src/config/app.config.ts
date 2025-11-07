import { registerAs } from "@nestjs/config";

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api',
  sms: {
    apiKey: process.env.SMS_API_KEY || '',
    apiUrl: process.env.SMS_API_URL || 'https://api.sms.ir/v1/send/verify',
    templateId: parseInt(process.env.SMS_TEMPLATE_ID || '123456', 10),
    sandbox: process.env.SMS_SANDBOX === 'true',
  },
}));