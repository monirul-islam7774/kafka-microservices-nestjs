import { Controller, Logger, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { EventPattern, MicroserviceOptions, Payload } from '@nestjs/microservices';
import { PaymentProcessedEvent } from '../contracts/events';
import { kafkaOptions } from '../contracts/kafka.config';
import { Topics } from '../contracts/topics';

export function renderMessage(e: PaymentProcessedEvent): string {
  const amount = (e.amount / 100).toFixed(2);
  return e.status === 'SUCCEEDED'
    ? `Payment of ${amount} ${e.currency} received. Your order ${e.orderId.slice(0, 8)} is confirmed.`
    : `Payment of ${amount} ${e.currency} was declined (${e.reason}). Order ${e.orderId.slice(0, 8)} cancelled.`;
}

@Controller()
export class NotificationController {
  private readonly logger = new Logger('Notification');

  @EventPattern(Topics.PAYMENT_PROCESSED)
  onPaymentProcessed(@Payload() event: PaymentProcessedEvent) {
    // Replace with an SMS / email / push provider.
    this.logger.log(`[to ${event.customerId}] ${renderMessage(event)}`);
  }
}

@Module({ controllers: [NotificationController] })
export class NotificationServiceModule {}

async function bootstrap() {
  // Its own consumer group, so it receives every payment event independently of order-service.
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    NotificationServiceModule,
    kafkaOptions('notification-service', 'notification-service'),
  );
  app.enableShutdownHooks();
  await app.listen();
  Logger.log('notification-service consuming payments.processed', 'Bootstrap');
}
if (require.main === module) bootstrap();
