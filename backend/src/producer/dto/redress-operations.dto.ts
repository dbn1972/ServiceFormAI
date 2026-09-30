import { IsIn, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class AssignRedressDto {
  @IsUUID()
  staffUserId: string;
}

export class ResolveGrievanceDto {
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  resolution: string;
}

export class DecideAppealDto {
  @IsIn(['upheld', 'remanded'])
  decision: 'upheld' | 'remanded';

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  reason: string;
}

export class CloseFeedbackDto {
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  response: string;
}
