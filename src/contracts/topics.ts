/** Kafka topic names shared by all services — the single source of truth for the event contract. */
export const Topics = {
  ORDER_CREATED: 'orders.created',
  PAYMENT_PROCESSED: 'payments.processed',
} as const;
