import type { ServiceFormSchema } from '../types/externalAPI';

/**
 * Maps old form data to a new schema.
 *
 * - Fields present in both old data and new schema: values are preserved
 * - Fields in old data but not in new schema: dropped
 * - Fields in new schema but not in old data: set to empty string
 *
 * @param oldData - The form data from the old schema version
 * @param newSchema - The new form schema to map to
 * @returns A new object with only the new schema's field IDs
 */
export function mapFormDataToNewSchema(
  oldData: Record<string, any>,
  newSchema: ServiceFormSchema,
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const field of newSchema.fields) {
    result[field.id] = field.id in oldData ? oldData[field.id] : '';
  }

  return result;
}
