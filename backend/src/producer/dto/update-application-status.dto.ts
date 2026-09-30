import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class UpdateApplicationStatusDto {
  @IsString()
  status: string;

  @IsString()
  @IsOptional()
  stage?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;

  @IsDateString()
  @IsOptional()
  deficiencyDueAt?: string;
}
