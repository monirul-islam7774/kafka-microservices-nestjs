import { Controller, Inject, Logger } from '@nestjs/common';
import { ClientKafka, EventPattern, Payload } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { OrderCreatedEvent } from '../contracts/events';
import { KAFKA_CLIENT } from '../contracts/kafka.config';
import { Topics } from '../contracts/topics';
import { PaymentProcessor } from './payment.processor';

@Controller()
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly processor: PaymentProcessor,
    @Inject(KAFKA_CLIENT) private readonly kafka: ClientKafka,
  ) {}

  @EventPattern(Topics.ORDER_CREATED)
  async onOrderCreated(@Payload() order: OrderCreatedEvent) {
    const { event, duplicate } = this.processor.process(order);
    if (!duplicate) this.logger.log(`Payment ${event.status} for order ${order.orderId}`);
    // Re-publish even for duplicates: a crash after charging but before publishing must still settle the order.
    await lastValueFrom(
      this.kafka.emit(Topics.PAYMENT_PROCESSED, { key: event.orderId, value: event }),
    );
  }
}
