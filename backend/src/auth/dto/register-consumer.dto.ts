import { IsString, IsEmail, IsOptional, IsObject, MinLength } from 'class-validator';

export class RegisterConsumerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  consumerSource: string;

  @IsString()
  @IsOptional()
  externalId: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @IsObject()
  @IsOptional()
  digilockerData?: any;
}
