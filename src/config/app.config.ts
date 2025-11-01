import { registerAs } from "@nestjs/config";

export default registerAs('app', () => ({
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || 'api',
    sms: {
        apiKey: process.env.SMS_API_KEY || '',
        apiUrl: process.env.SMS_API_URL || '',
        sandbox: process.env.SMS_SANDBOX || false,
    }
}))