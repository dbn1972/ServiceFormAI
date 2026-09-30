import { IsEmail, IsString, IsUUID, MinLength, IsOptional } from 'class-validator';

export class RegisterTenantDto {
  @IsUUID()
  tenantId: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  role: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  orgName?: string;

  @IsString()
  @IsOptional()
  organizationType?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  municipalityName?: string;

  @IsString()
  @IsOptional()
  officeName?: string;
}
