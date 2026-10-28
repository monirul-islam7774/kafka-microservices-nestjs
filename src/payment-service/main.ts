import { Logger, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ClientsModule, MicroserviceOptions } from '@nestjs/microservices';
import { KAFKA_CLIENT, kafkaOptions } from '../contracts/kafka.config';
import { PaymentController } from './payment.controller';
import { PaymentProcessor } from './payment.processor';

@Module({
  imports: [
    ClientsModule.register([
      { name: KAFKA_CLIENT, ...kafkaOptions('payment-service', 'payment-service-producer') },
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentProcessor],
})
export class PaymentServiceModule {}

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PaymentServiceModule,
    kafkaOptions('payment-service', 'payment-service'),
  );
  app.enableShutdownHooks();
  await app.listen();
  Logger.log('payment-service consuming orders.created', 'Bootstrap');
}
if (require.main === module) bootstrap();
