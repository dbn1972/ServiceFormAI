import { IsString, IsObject, IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class UpdateServiceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  formSchema?: any;

  @IsObject()
  @IsOptional()
  workflowConfig?: any;

  @IsObject()
  @IsOptional()
  eligibilityRules?: any;

  @IsObject()
  @IsOptional()
  requiredDocuments?: any;

  @IsObject()
  @IsOptional()
  backendApiConfig?: any;

  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @IsNumber()
  @IsOptional()
  slaDays?: number;

  @IsNumber()
  @IsOptional()
  fees?: number;
}
