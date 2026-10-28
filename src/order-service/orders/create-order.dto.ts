import { IsIn, IsInt, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @MaxLength(64)
  customerId!: string;

  /** Minor units, e.g. 150000 = 1,500.00 BDT */
  @IsInt()
  @IsPositive()
  amount!: number;

  @IsIn(['BDT', 'USD', 'JPY'])
  currency!: string;
}
