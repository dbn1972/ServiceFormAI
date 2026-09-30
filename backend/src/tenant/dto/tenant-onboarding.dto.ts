import {
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class TenantOnboardingDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  orgName: string;

  @IsIn(['state-dept', 'central-ministry', 'district-office', 'municipality', 'panchayat', 'parastatal', 'board'])
  orgType: string;

  @IsString()
  @MaxLength(120)
  state: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  municipalityName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  officeName?: string;

  @IsString()
  @Matches(/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/)
  subdomain: string;

  @IsEmail()
  adminEmail: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  adminName: string;

  @IsString()
  @Matches(/^[6-9]\d{9}$/)
  adminMobile: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requestedServices?: string[];
}