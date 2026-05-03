import { IsString, IsOptional } from 'class-validator';

export class UpdateApplicationStatusDto {
  @IsString()
  status: string;

  @IsString()
  @IsOptional()
  stage?: string;
}
