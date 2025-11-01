import { registerAs } from "@nestjs/config"

export default registerAs('rabbitmq', () => ({
  url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  queue: {
    prediction: 'prediction.process',
    predictionDLQ: 'prediction.process.dlq',
  }
}));