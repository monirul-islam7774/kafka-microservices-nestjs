import { OrderCreatedEvent } from '../contracts/events';
import { PaymentProcessor, SINGLE_PAYMENT_LIMIT } from './payment.processor';

const order = (amount: number, orderId = 'o-1'): OrderCreatedEvent => ({
  version: 1,
  eventId: 'e-1',
  orderId,
  customerId: 'c-1',
  amount,
  currency: 'BDT',
  occurredAt: new Date().toISOString(),
});

describe('PaymentProcessor', () => {
  let processor: PaymentProcessor;
  beforeEach(() => (processor = new PaymentProcessor()));

  it('approves payments within the limit', () => {
    const { event } = processor.process(order(150_000));
    expect(event).toMatchObject({ orderId: 'o-1', status: 'SUCCEEDED', amount: 150_000 });
  });

  it('declines payments over the limit with a reason', () => {
    const { event } = processor.process(order(SINGLE_PAYMENT_LIMIT + 1));
    expect(event).toMatchObject({ status: 'DECLINED', reason: 'AMOUNT_OVER_LIMIT' });
  });

  it('is idempotent for re-delivered events (no double charge)', () => {
    const first = processor.process(order(1000));
    const second = processor.process(order(1000));
    expect(second.duplicate).toBe(true);
    expect(second.event.paymentId).toBe(first.event.paymentId);
  });
});
