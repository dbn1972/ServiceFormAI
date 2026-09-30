import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  applicationId: string;

  @IsUUID()
  @IsNotEmpty()
  serviceId: string;
}
