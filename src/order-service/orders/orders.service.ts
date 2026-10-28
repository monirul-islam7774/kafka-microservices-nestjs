import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { randomUUID } from 'crypto';
import { lastValueFrom } from 'rxjs';
import { OrderCreatedEvent, PaymentProcessedEvent } from '../../contracts/events';
import { KAFKA_CLIENT } from '../../contracts/kafka.config';
import { Topics } from '../../contracts/topics';
import { CreateOrderDto } from './create-order.dto';

export type OrderStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED';

export interface Order {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  paymentId?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  // In-memory store keeps the demo focused on messaging. See README roadmap for Postgres + outbox.
  private readonly orders = new Map<string, Order>();

  constructor(@Inject(KAFKA_CLIENT) private readonly kafka: ClientKafka) {}

  async create(dto: CreateOrderDto): Promise<Order> {
    const now = new Date().toISOString();
    const order: Order = {
      id: randomUUID(),
      ...dto,
      status: 'PENDING_PAYMENT',
      createdAt: now,
      updatedAt: now,
    };
    this.orders.set(order.id, order);

    const event: OrderCreatedEvent = {
      version: 1,
      eventId: randomUUID(),
      orderId: order.id,
      customerId: order.customerId,
      amount: order.amount,
      currency: order.currency,
      occurredAt: now,
    };
    // Key by orderId so all events of one order land in the same partition (ordering guarantee).
    await lastValueFrom(this.kafka.emit(Topics.ORDER_CREATED, { key: order.id, value: event }));
    this.logger.log(`Order ${order.id} created, event published`);
    return order;
  }

  findOne(id: string): Order {
    const order = this.orders.get(id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  findAll(): Order[] {
    return [...this.orders.values()];
  }

  /** Idempotent: re-delivered events for an already-settled order are ignored. */
  applyPaymentResult(event: PaymentProcessedEvent): Order | undefined {
    const order = this.orders.get(event.orderId);
    if (!order) {
      this.logger.warn(`Payment for unknown order ${event.orderId}`);
      return undefined;
    }
    if (order.status !== 'PENDING_PAYMENT') return order;

    order.status = event.status === 'SUCCEEDED' ? 'CONFIRMED' : 'CANCELLED';
    order.paymentId = event.paymentId;
    order.failureReason = event.reason;
    order.updatedAt = new Date().toISOString();
    this.logger.log(`Order ${order.id} -> ${order.status}`);
    return order;
  }
}
