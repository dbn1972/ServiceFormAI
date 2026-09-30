import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ValidatorDefinitionDto } from './create-custom-component.dto';

export class UpdateCustomComponentDto {
  @IsString()
  @IsOptional()
  @Length(1, 255)
  displayName?: string;

  @IsString()
  @IsOptional()
  @Length(1, 20)
  version?: string;

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
