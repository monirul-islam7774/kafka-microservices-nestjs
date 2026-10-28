import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { OrderCreatedEvent, PaymentProcessedEvent } from '../contracts/events';

/** Simulated payment gateway rules — swap for a real provider later. */
export const SINGLE_PAYMENT_LIMIT = 500_000_00; // 500,000.00 in minor units

@Injectable()
export class PaymentProcessor {
  private readonly logger = new Logger(PaymentProcessor.name);
  /** orderId -> result. Kafka is at-least-once, so duplicates must not charge twice. */
  private readonly processed = new Map<string, PaymentProcessedEvent>();

  process(order: OrderCreatedEvent): { event: PaymentProcessedEvent; duplicate: boolean } {
    const existing = this.processed.get(order.orderId);
    if (existing) {
      this.logger.warn(`Duplicate order event ${order.orderId} — returning previous result`);
      return { event: existing, duplicate: true };
    }

    const declined = order.amount > SINGLE_PAYMENT_LIMIT;
    const event: PaymentProcessedEvent = {
      version: 1,
      eventId: randomUUID(),
      orderId: order.orderId,
      customerId: order.customerId,
      paymentId: randomUUID(),
      status: declined ? 'DECLINED' : 'SUCCEEDED',
      reason: declined ? 'AMOUNT_OVER_LIMIT' : undefined,
      amount: order.amount,
      currency: order.currency,
      occurredAt: new Date().toISOString(),
    };
    this.processed.set(order.orderId, event);
    return { event, duplicate: false };
  }
}
