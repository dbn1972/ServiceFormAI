import { IsString, IsUUID, Matches } from 'class-validator';

export class VerifyCitizenOtpDto {
  @IsUUID()
  challengeId: string;

  @IsString()
  @Matches(/^(?:\+91)?[6-9]\d{9}$/, {
    message: 'mobile must be a valid Indian mobile number',
  })
  mobile: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'code must contain 6 digits' })
  code: string;
}