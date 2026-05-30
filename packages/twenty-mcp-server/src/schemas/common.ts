import { isValidUuid } from 'twenty-shared/utils';
import { z } from 'zod';

export const recordIdSchema = z
  .string()
  .refine(isValidUuid, { message: 'Must be a valid UUID' });

export const objectNamePluralSchema = z
  .string()
  .min(1)
  .describe(
    'Plural REST name of the object, e.g. "companies", "people", "opportunities", "notes", "tasks". Call list_objects to discover the exact names (including custom objects).',
  );

export const objectNameSingularSchema = z
  .string()
  .min(1)
  .describe('Singular name of the object, e.g. "company", "person".');

export const depthSchema = z
  .union([z.literal(0), z.literal(1)])
  .optional()
  .describe(
    'How many levels of related records to include: 0 (default, scalar fields only) or 1 (include directly related records).',
  );

export const limitSchema = z
  .number()
  .int()
  .positive()
  .optional()
  .describe('Maximum number of records to return.');

export const filterSchema = z
  .string()
  .optional()
  .describe(
    [
      'Twenty REST filter string: "field[comparator]:value".',
      'Comparators: eq, neq, in, containsAny, is, gt, gte, lt, lte, startsWith, endsWith, like, ilike.',
      'Nested/composite fields use dots, e.g. "name.firstName[eq]:John".',
      'Combine predicates with and(...) / or(...), e.g. "and(employees[gte]:10,name[ilike]:%acme%)".',
    ].join(' '),
  );

export const orderBySchema = z
  .string()
  .optional()
  .describe(
    'Ordering, e.g. "createdAt[DescNullsLast]" or "name.firstName[AscNullsFirst],createdAt[DescNullsLast]".',
  );

export const recordDataSchema = z
  .record(z.string(), z.unknown())
  .describe(
    'Record fields as a JSON object. Use describe_object to learn the available field names and types.',
  );
