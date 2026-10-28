import { NotFoundException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { of } from 'rxjs';
import { PaymentProcessedEvent } from '../../contracts/events';
import { Topics } from '../../contracts/topics';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let kafka: { emit: jest.Mock };
  let service: OrdersService;

  beforeEach(() => {
    kafka = { emit: jest.fn(() => of(undefined)) };
    service = new OrdersService(kafka as unknown as ClientKafka);
  });

  const paymentFor = (
    orderId: string,
    status: 'SUCCEEDED' | 'DECLINED',
  ): PaymentProcessedEvent => ({
    version: 1,
    eventId: 'e',
    orderId,
    customerId: 'c-1',
    paymentId: 'p-1',
    status,
    amount: 1000,
    currency: 'BDT',
    occurredAt: new Date().toISOString(),
  });

  it('creates a pending order and publishes orders.created keyed by orderId', async () => {
    const order = await service.create({ customerId: 'c-1', amount: 1000, currency: 'BDT' });
    expect(order.status).toBe('PENDING_PAYMENT');
    expect(kafka.emit).toHaveBeenCalledWith(
      Topics.ORDER_CREATED,
      expect.objectContaining({
        key: order.id,
        value: expect.objectContaining({ orderId: order.id }),
      }),
    );
  });

  it('confirms the order on successful payment', async () => {
    const order = await service.create({ customerId: 'c-1', amount: 1000, currency: 'BDT' });
    service.applyPaymentResult(paymentFor(order.id, 'SUCCEEDED'));
    expect(service.findOne(order.id).status).toBe('CONFIRMED');
  });

  it('ignores duplicate / late payment events once settled', async () => {
    const order = await service.create({ customerId: 'c-1', amount: 1000, currency: 'BDT' });
    service.applyPaymentResult(paymentFor(order.id, 'SUCCEEDED'));
    service.applyPaymentResult(paymentFor(order.id, 'DECLINED'));
    expect(service.findOne(order.id).status).toBe('CONFIRMED');
  });

  it('throws for unknown orders', () => {
    expect(() => service.findOne('nope')).toThrow(NotFoundException);
  });
});
