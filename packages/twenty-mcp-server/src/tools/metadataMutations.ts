import { z } from 'zod';

import { recordIdSchema } from '@/schemas/common';
import {
  CREATE_FIELD_MUTATION,
  CREATE_OBJECT_MUTATION,
  UPDATE_FIELD_MUTATION,
  UPDATE_OBJECT_MUTATION,
} from '@/schemas/graphqlQueries';
import { defineTool } from '@/tools/toolDefinition';

const metadataNameSchema = z
  .string()
  .regex(
    /^[a-zA-Z][a-zA-Z0-9]*$/,
    'Must be camelCase letters/digits starting with a letter (e.g. "myCustomObject").',
  );

export const createObjectTool = defineTool({
  name: 'create_object',
  title: 'Create object',
  description:
    'Create a new custom object (a new table/data model) in the workspace. Names must be camelCase; labels are human-readable.',
  inputSchema: {
    nameSingular: metadataNameSchema.describe('e.g. "rocket"'),
    namePlural: metadataNameSchema.describe('e.g. "rockets"'),
    labelSingular: z.string().min(1).describe('e.g. "Rocket"'),
    labelPlural: z.string().min(1).describe('e.g. "Rockets"'),
    description: z.string().optional(),
    icon: z
      .string()
      .optional()
      .describe('Tabler icon name, e.g. "IconRocket".'),
    color: z.string().optional(),
    isLabelSyncedWithName: z.boolean().optional(),
  },
  handler: (client, args) =>
    client.metadata(CREATE_OBJECT_MUTATION, { input: { object: args } }),
});

export const updateObjectTool = defineTool({
  name: 'update_object',
  title: 'Update object',
  description:
    'Update a custom object’s definition (labels, names, description, icon). Pass only the fields you want to change in `update`.',
  inputSchema: {
    objectMetadataId: recordIdSchema.describe(
      'The object metadata id (from list_objects / describe_object).',
    ),
    update: z
      .record(z.string(), z.unknown())
      .describe(
        'Fields to change, e.g. {"labelSingular":"Rocketship","description":"..."}.',
      ),
  },
  handler: (client, { objectMetadataId, update }) =>
    client.metadata(UPDATE_OBJECT_MUTATION, {
      input: { id: objectMetadataId, update },
    }),
});

export const createFieldTool = defineTool({
  name: 'create_field',
  title: 'Create field',
  description:
    'Add a field to an object. Common types: TEXT, NUMBER, BOOLEAN, DATE_TIME, EMAILS, PHONES, LINKS, CURRENCY, SELECT, MULTI_SELECT, RATING. For SELECT/MULTI_SELECT pass `options`. To create a relation field, use create_relation instead.',
  inputSchema: {
    objectMetadataId: recordIdSchema,
    type: z.string().describe('FieldMetadataType, e.g. "TEXT", "NUMBER".'),
    name: metadataNameSchema.describe('Field API name (camelCase).'),
    label: z.string().min(1).describe('Human-readable label.'),
    description: z.string().optional(),
    icon: z.string().optional(),
    isNullable: z.boolean().optional(),
    isUnique: z.boolean().optional(),
    defaultValue: z.unknown().optional(),
    options: z
      .array(z.record(z.string(), z.unknown()))
      .optional()
      .describe(
        'For SELECT/MULTI_SELECT: [{"value":"OPEN","label":"Open","color":"green","position":0}].',
      ),
    settings: z.record(z.string(), z.unknown()).optional(),
  },
  handler: (client, args) =>
    client.metadata(CREATE_FIELD_MUTATION, { input: { field: args } }),
});

export const updateFieldTool = defineTool({
  name: 'update_field',
  title: 'Update field',
  description:
    'Update a field definition (label, description, options, nullability — not its type). Pass changes in `update`.',
  inputSchema: {
    fieldMetadataId: recordIdSchema,
    update: z
      .record(z.string(), z.unknown())
      .describe('Fields to change, e.g. {"label":"New label"}.'),
  },
  handler: (client, { fieldMetadataId, update }) =>
    client.metadata(UPDATE_FIELD_MUTATION, {
      input: { id: fieldMetadataId, update },
    }),
});

export const createRelationTool = defineTool({
  name: 'create_relation',
  title: 'Create relation',
  description:
    'Create a relation field linking one object to another (e.g. company → opportunities). Implemented as a RELATION field with a relation creation payload.',
  inputSchema: {
    objectMetadataId: recordIdSchema.describe('Source object metadata id.'),
    name: metadataNameSchema.describe('Relation field API name on the source.'),
    label: z.string().min(1).describe('Relation field label on the source.'),
    relationType: z
      .enum(['MANY_TO_ONE', 'ONE_TO_MANY'])
      .describe('Cardinality from the source object’s perspective.'),
    targetObjectMetadataId: recordIdSchema.describe(
      'Target object metadata id.',
    ),
    targetFieldLabel: z
      .string()
      .min(1)
      .describe('Label for the inverse field created on the target object.'),
    targetFieldIcon: z.string().optional(),
    icon: z.string().optional(),
  },
  handler: (
    client,
    {
      objectMetadataId,
      name,
      label,
      relationType,
      targetObjectMetadataId,
      targetFieldLabel,
      targetFieldIcon,
      icon,
    },
  ) =>
    client.metadata(CREATE_FIELD_MUTATION, {
      input: {
        field: {
          objectMetadataId,
          name,
          label,
          icon,
          type: 'RELATION',
          relationCreationPayload: {
            type: relationType,
            targetObjectMetadataId,
            targetFieldLabel,
            targetFieldIcon: targetFieldIcon ?? icon,
          },
        },
      },
    }),
});

export const metadataTools = [
  createObjectTool,
  updateObjectTool,
  createFieldTool,
  updateFieldTool,
  createRelationTool,
];
