import { IsString, Matches } from 'class-validator';

export class IssueCitizenOtpDto {
  @IsString()
  @Matches(/^(?:\+91)?[6-9]\d{9}$/, {
    message: 'mobile must be a valid Indian mobile number',
  })
  mobile: string;
}