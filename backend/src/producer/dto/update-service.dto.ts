import { IsString, IsObject, IsBoolean, IsNumber, IsOptional, IsIn, IsArray, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ServiceScopeDto {
  @IsOptional() @IsIn(['ministry', 'department', 'state', 'district', 'district_office', 'municipality', 'panchayat']) owner_level?: string;
  @IsOptional() @IsIn(['central', 'state', 'district', 'department']) monitoring_mode?: string;
  @IsOptional() @IsIn(['central', 'state', 'district', 'urban_local_body', 'rural_local_body', 'mixed']) jurisdiction_model?: string;
  @IsOptional() @IsString() @MaxLength(120) ministry_code?: string;
  @IsOptional() @IsString() @MaxLength(255) ministry_name?: string;
  @IsOptional() @IsString() @MaxLength(120) department_code?: string;
  @IsOptional() @IsString() @MaxLength(255) department_name?: string;
  @IsOptional() @IsString() @MaxLength(50) state_lgd_code?: string;
  @IsOptional() @IsString() @MaxLength(255) state_name?: string;
  @IsOptional() @IsString() @MaxLength(50) district_lgd_code?: string;
  @IsOptional() @IsString() @MaxLength(255) district_name?: string;
  @IsOptional() @IsString() @MaxLength(50) subdistrict_lgd_code?: string;
  @IsOptional() @IsString() @MaxLength(255) subdistrict_name?: string;
  @IsOptional() @IsString() @MaxLength(50) block_lgd_code?: string;
  @IsOptional() @IsString() @MaxLength(255) block_name?: string;
  @IsOptional() @IsString() @MaxLength(50) tehsil_code?: string;
  @IsOptional() @IsString() @MaxLength(255) tehsil_name?: string;
  @IsOptional() @IsString() @MaxLength(50) taluka_code?: string;
  @IsOptional() @IsString() @MaxLength(255) taluka_name?: string;
  @IsOptional() @IsString() @MaxLength(50) municipality_lgd_code?: string;
  @IsOptional() @IsString() @MaxLength(255) municipality_name?: string;
  @IsOptional() @IsIn(['municipal_corporation', 'municipality', 'nagar_panchayat', 'town_panchayat', 'other']) ulb_type?: string;
  @IsOptional() @IsString() @MaxLength(50) panchayat_lgd_code?: string;
  @IsOptional() @IsString() @MaxLength(255) panchayat_name?: string;
  @IsOptional() @IsString() @MaxLength(50) gram_panchayat_code?: string;
  @IsOptional() @IsString() @MaxLength(255) gram_panchayat_name?: string;
  @IsOptional() @IsString() @MaxLength(50) ward_code?: string;
  @IsOptional() @IsString() @MaxLength(255) ward_name?: string;
  @IsOptional() @IsString() @MaxLength(50) village_code?: string;
  @IsOptional() @IsString() @MaxLength(255) village_name?: string;
  @IsOptional() @IsString() @MaxLength(50) lgd_standard?: string;
}

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

  @IsArray()
  @IsOptional()
  requiredDocuments?: any;

  @IsObject()
  @IsOptional()
  manifest?: any;

  @IsObject()
  @IsOptional()
  backendApiConfig?: any;

  @IsOptional()
  @ValidateNested()
  @Type(() => ServiceScopeDto)
  serviceScope?: ServiceScopeDto;

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
