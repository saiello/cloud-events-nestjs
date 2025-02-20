import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  // pattern is the cloud event type
  @EventPattern('ce.order.created')
  handleOrderCreated(
    @Payload('data') data: any,
    @Payload('source') ceSource: string,
  ) {
    console.log('Event "Order Created" received', data, ceSource);
  }

  @EventPattern('ce.order.deleted')
  handleOrderDeleted(
    @Payload('data') data: any,
    @Payload('source') ceSource: string,
  ) {
    console.log('Event "Order Deleted" received', data, ceSource);
  }
}
