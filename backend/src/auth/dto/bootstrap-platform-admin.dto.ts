import { IsEmail, IsString, MinLength, IsOptional, MaxLength } from 'class-validator';

export class BootstrapPlatformAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(12)
  password: string;

  @IsString()
  @MinLength(32)
  bootstrapSecret: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;
}
