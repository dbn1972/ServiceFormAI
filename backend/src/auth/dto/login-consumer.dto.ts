import { IsIn, IsString, MinLength } from 'class-validator';

export class LoginConsumerDto {
  @IsString()
  identifier: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsIn(['email', 'mobile'])
  method: 'email' | 'mobile';
}
