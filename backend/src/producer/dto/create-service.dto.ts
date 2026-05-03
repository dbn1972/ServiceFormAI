import { IsString, IsObject, IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  formSchema: any;

  @IsObject()
  workflowConfig: any;

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
