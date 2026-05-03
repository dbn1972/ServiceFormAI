import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  MaxLength,
} from 'class-validator';

const ALLOWED_PROVIDERS = [
  'digilocker',
  'aadhaar_otp',
  'razorpay',
  'payu',
  'sendgrid',
  'twilio',
  'aws_s3',
  'azure_blob',
  'custom_webhook',
] as const;

export class UpsertIntegrationDto {
  @IsEnum(ALLOWED_PROVIDERS)
  provider: string;

  @IsEnum(['active', 'disabled', 'sandbox'])
  status: 'active' | 'disabled' | 'sandbox';

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  // Callers send reference NAMES only — never raw secrets
  @IsOptional()
  @IsObject()
  credential_refs?: Record<string, string>;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  webhook_secret_ref?: string;
}
