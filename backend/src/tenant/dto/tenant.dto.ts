import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsIn,
  MaxLength,
  ValidateNested,
  IsBoolean,
  IsInt,
  IsArray,
  IsUrl,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

class BrandingDto {
  @IsOptional() @IsUrl() logo_url?: string;
  @IsOptional() @IsString() @MaxLength(7) primary_color?: string;
  @IsOptional() @IsString() @MaxLength(255) display_name?: string;
  @IsOptional() @IsEmail() support_email?: string;
  @IsOptional() @IsString() @MaxLength(20) support_phone?: string;
  @IsOptional() @IsString() @MaxLength(500) footer_text?: string;
}

class AuthPolicyDto {
  @IsOptional() @IsBoolean() mfa_required?: boolean;
  @IsOptional() @IsInt() @Min(5) @Max(1440) session_timeout_minutes?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) allowed_email_domains?: string[];
  @IsOptional() @IsInt() @Min(8) @Max(128) password_min_length?: number;
  @IsOptional() @IsInt() @Min(3) @Max(20) max_login_failures?: number;
  @IsOptional() @IsInt() @Min(1) @Max(1440) lockout_minutes?: number;
}

class ConsentPolicyDto {
  @IsOptional() @IsBoolean() require_consent_before_submission?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) consent_purposes?: string[];
  @IsOptional() @IsInt() @Min(1) consent_expiry_days?: number;
  @IsOptional() @IsInt() @Min(1) data_retention_days?: number;
}

class NotificationPolicyDto {
  @IsOptional() @IsBoolean() email_enabled?: boolean;
  @IsOptional() @IsBoolean() sms_enabled?: boolean;
  @IsOptional() @IsString() @MaxLength(500) webhook_url?: string;
}

class IntegrationPolicyDto {
  @IsOptional() @IsArray() @IsString({ each: true }) allowed_providers?: string[];
  @IsOptional() @IsBoolean() sandbox_mode?: boolean;
}

class GovernanceScopeDto {
  @IsOptional() @IsIn(['ministry', 'department', 'state', 'district', 'district_office', 'municipality', 'panchayat']) owner_level?: 'ministry' | 'department' | 'state' | 'district' | 'district_office' | 'municipality' | 'panchayat';
  @IsOptional() @IsIn(['central', 'state', 'district', 'department']) monitoring_mode?: 'central' | 'state' | 'district' | 'department';
  @IsOptional() @IsIn(['central', 'state', 'district', 'urban_local_body', 'rural_local_body', 'mixed']) jurisdiction_model?: 'central' | 'state' | 'district' | 'urban_local_body' | 'rural_local_body' | 'mixed';
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
  @IsOptional() @IsIn(['municipal_corporation', 'municipality', 'nagar_panchayat', 'town_panchayat', 'other']) ulb_type?: 'municipal_corporation' | 'municipality' | 'nagar_panchayat' | 'town_panchayat' | 'other';
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

export class CreateTenantDto {
  @IsString() @MaxLength(255) name: string;
  @IsEnum(['government', 'enterprise', 'ngo', 'other']) type: string;
  @IsOptional() @IsEmail() contact_email?: string;
  @IsOptional() @IsString() @MaxLength(255) api_base_url?: string;
  @IsOptional() @ValidateNested() @Type(() => BrandingDto) branding?: BrandingDto;
  @IsOptional() @ValidateNested() @Type(() => AuthPolicyDto) auth_policy?: AuthPolicyDto;
  @IsOptional() @ValidateNested() @Type(() => ConsentPolicyDto) consent_policy?: ConsentPolicyDto;
  @IsOptional() @ValidateNested() @Type(() => NotificationPolicyDto) notification_policy?: NotificationPolicyDto;
  @IsOptional() @ValidateNested() @Type(() => IntegrationPolicyDto) integration_policy?: IntegrationPolicyDto;
  @IsOptional() @ValidateNested() @Type(() => GovernanceScopeDto) governance_scope?: GovernanceScopeDto;
}

export class UpdateTenantDto {
  @IsOptional() @IsString() @MaxLength(255) name?: string;
  @IsOptional() @IsEnum(['active', 'suspended', 'onboarding', 'offboarded']) status?: string;
  @IsOptional() @IsEmail() contact_email?: string;
  @IsOptional() @IsString() @MaxLength(255) api_base_url?: string;
  @IsOptional() @ValidateNested() @Type(() => BrandingDto) branding?: BrandingDto;
  @IsOptional() @ValidateNested() @Type(() => AuthPolicyDto) auth_policy?: AuthPolicyDto;
  @IsOptional() @ValidateNested() @Type(() => ConsentPolicyDto) consent_policy?: ConsentPolicyDto;
  @IsOptional() @ValidateNested() @Type(() => NotificationPolicyDto) notification_policy?: NotificationPolicyDto;
  @IsOptional() @ValidateNested() @Type(() => IntegrationPolicyDto) integration_policy?: IntegrationPolicyDto;
  @IsOptional() @ValidateNested() @Type(() => GovernanceScopeDto) governance_scope?: GovernanceScopeDto;
}

export class SuspendTenantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
