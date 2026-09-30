import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  Length,
  Matches,
  ValidateNested,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ValidatorDefinitionDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  params?: Record<string, unknown>;
}

export class CreateCustomComponentDto {
  @IsString()
  @Length(3, 50)
  @Matches(/^[a-z][a-z0-9_-]{2,49}$/, {
    message:
      'fieldType must be 3-50 characters, start with a lowercase letter, and contain only lowercase alphanumeric characters, hyphens, and underscores',
  })
  fieldType: string;

  @IsString()
  @Length(1, 255)
  displayName: string;

  @IsString()
  @Length(1, 20)
  version: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @Length(1, 500)
  bundleUrl?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ValidatorDefinitionDto)
  validators?: ValidatorDefinitionDto[];

  @IsObject()
  @IsOptional()
  defaultConfig?: Record<string, unknown>;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  allowedDomains?: string[];
}
