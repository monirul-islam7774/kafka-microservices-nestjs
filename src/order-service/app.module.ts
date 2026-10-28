import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { KAFKA_CLIENT, kafkaOptions } from '../contracts/kafka.config';
import { HealthController } from '../contracts/health.controller';
import { OrdersController } from './orders/orders.controller';
import { OrdersService } from './orders/orders.service';

@Module({
  imports: [
    ClientsModule.register([
      { name: KAFKA_CLIENT, ...kafkaOptions('order-service', 'order-service-producer') },
    ]),
  ],
  controllers: [OrdersController, HealthController],
  providers: [OrdersService],
})
export class OrderServiceModule {}
