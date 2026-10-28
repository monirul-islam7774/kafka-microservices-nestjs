import { renderMessage } from './main';

describe('renderMessage', () => {
  const base = {
    version: 1 as const,
    eventId: 'e',
    orderId: '12345678-aaaa',
    customerId: 'c',
    paymentId: 'p',
    amount: 150050,
    currency: 'BDT',
    occurredAt: '',
  };

  it('formats a success message with major units', () => {
    expect(renderMessage({ ...base, status: 'SUCCEEDED' })).toContain('1500.50 BDT received');
  });

  it('includes the decline reason', () => {
    expect(renderMessage({ ...base, status: 'DECLINED', reason: 'AMOUNT_OVER_LIMIT' })).toContain(
      'AMOUNT_OVER_LIMIT',
    );
  });
});
