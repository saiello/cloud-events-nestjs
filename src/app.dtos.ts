import { IsNotEmpty } from 'class-validator';

export class OrderCreatedDto {
  @IsNotEmpty()
  orderId: string;

  @IsNotEmpty()
  customer: string;
}

export class OrderDeletedDto {
  @IsNotEmpty()
  orderId: string;

  @IsNotEmpty()
  reason: string;
}
