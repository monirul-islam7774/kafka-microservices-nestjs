import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { kafkaOptions } from '../contracts/kafka.config';
import { OrderServiceModule } from './app.module';

async function bootstrap() {
  // Hybrid app: HTTP API for clients + Kafka consumer for payment results.
  const app = await NestFactory.create(OrderServiceModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.connectMicroservice(kafkaOptions('order-service', 'order-service'));
  app.enableShutdownHooks();
  await app.startAllMicroservices();
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`order-service listening on :${port}`, 'Bootstrap');
}
bootstrap();
