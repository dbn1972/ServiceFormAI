import { IsUUID, IsObject, IsOptional, IsInt, Min } from 'class-validator';

export class SubmitApplicationDto {
  @IsUUID()
  serviceId: string;

  @IsObject()
  formData: any;

  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  schemaVersion?: number;
}
