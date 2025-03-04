import { Controller, UseInterceptors } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { OrderCreatedDto, OrderDeletedDto } from './app.dtos';
import { LoggingInterceptor } from './app.interceptor';

@UseInterceptors(LoggingInterceptor)
@Controller()
export class AppController {
  // pattern is the cloud event type
  @EventPattern('ce.order.created')
  handleOrderCreated(
    @Payload('data') data: OrderCreatedDto,
    @Payload('source') ceSource: string,
  ) {
    console.log('Event "Order Created" received', data, ceSource);
  }

  @EventPattern('ce.order.deleted')
  handleOrderDeleted(
    @Payload('data') data: OrderDeletedDto,
    @Payload('source') ceSource: string,
  ) {
    console.log('Event "Order Deleted" received', data, ceSource);
  }
}
