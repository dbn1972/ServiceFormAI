import { IsIn, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateGrievanceDto {
  @IsUUID()
  applicationId: string;

  @IsIn(['service_delivery', 'delay', 'conduct', 'technical', 'other'])
  category: string;

  @IsString()
  @MinLength(3)
  @MaxLength(255)
  subject: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description: string;
}