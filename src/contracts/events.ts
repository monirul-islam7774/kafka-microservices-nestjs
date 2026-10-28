/** Versioned event payloads. Add fields in a backward-compatible way; bump `version` on breaking changes. */
export interface OrderCreatedEvent {
  version: 1;
  eventId: string;
  orderId: string;
  customerId: string;
  amount: number; // minor units
  currency: string;
  occurredAt: string;
}

export type PaymentStatus = 'SUCCEEDED' | 'DECLINED';

export interface PaymentProcessedEvent {
  version: 1;
  eventId: string;
  orderId: string;
  customerId: string;
  paymentId: string;
  status: PaymentStatus;
  reason?: string;
  amount: number;
  currency: string;
  occurredAt: string;
}
