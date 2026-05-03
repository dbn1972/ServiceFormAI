import { IsString, IsUUID, IsOptional, MaxLength, IsDateString, IsNotEmpty } from 'class-validator';

export class RequestConsentDto {
  @IsUUID()
  tenantId: string;

  @IsString()
  @MaxLength(100)
  purpose: string;

  @IsString()
  @MaxLength(1000)
  purposeDescription: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  resourceType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  resourceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  requestId?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class AdminRevokeConsentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
