import { IsIn, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateAppealDto {
  @IsUUID()
  applicationId: string;

  @IsIn(['incorrect_facts', 'rule_misapplied', 'evidence_overlooked', 'procedural_error', 'other'])
  grounds: string;

  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  statement: string;
}