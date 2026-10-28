import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PaymentProcessedEvent } from '../../contracts/events';
import { Topics } from '../../contracts/topics';
import { CreateOrderDto } from './create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @EventPattern(Topics.PAYMENT_PROCESSED)
  onPaymentProcessed(@Payload() event: PaymentProcessedEvent) {
    this.ordersService.applyPaymentResult(event);
  }
}
