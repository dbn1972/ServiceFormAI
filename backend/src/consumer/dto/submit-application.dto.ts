import { IsUUID, IsObject } from 'class-validator';

export class SubmitApplicationDto {
  @IsUUID()
  serviceId: string;

  @IsObject()
  formData: any;
}
