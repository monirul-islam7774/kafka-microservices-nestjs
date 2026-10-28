import { KafkaOptions, Transport } from '@nestjs/microservices';

export const KAFKA_CLIENT = 'KAFKA_CLIENT';

export function kafkaOptions(clientId: string, groupId: string): KafkaOptions {
  return {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId,
        brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
        retry: { retries: 10, initialRetryTime: 300 },
      },
      consumer: { groupId, allowAutoTopicCreation: true },
      producer: { allowAutoTopicCreation: true, idempotent: true, maxInFlightRequests: 1 },
    },
  };
}
