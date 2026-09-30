import { IsObject, IsOptional, IsUUID } from 'class-validator';

export class SaveApplicationDraftDto {
  @IsObject()
  formData: Record<string, unknown>;

  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @IsOptional()
  schemaVersion?: number;
}