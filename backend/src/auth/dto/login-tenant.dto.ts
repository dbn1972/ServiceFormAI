import { IsEmail, IsString, IsUUID } from 'class-validator';

export class LoginTenantDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsUUID()
  tenantId: string;
}
