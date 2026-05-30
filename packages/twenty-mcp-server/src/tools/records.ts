import { z } from 'zod';

import {
  depthSchema,
  filterSchema,
  limitSchema,
  objectNamePluralSchema,
  orderBySchema,
  recordDataSchema,
  recordIdSchema,
} from '@/schemas/common';
import { defineTool } from '@/tools/toolDefinition';

export const findRecordsTool = defineTool({
  name: 'find_records',
  title: 'Find records',
  description:
    'List/search records of an object with filtering, ordering, pagination and relation depth. Returns the matching records plus pageInfo/totalCount.',
  inputSchema: {
    objectName: objectNamePluralSchema,
    filter: filterSchema,
    orderBy: orderBySchema,
    limit: limitSchema,
    depth: depthSchema,
    startingAfter: z
      .string()
      .optional()
      .describe('Pagination cursor: return records after this cursor.'),
    endingBefore: z
      .string()
      .optional()
      .describe('Pagination cursor: return records before this cursor.'),
  },
  annotations: { readOnlyHint: true },
  handler: (client, { objectName, ...query }) =>
    client.rest({ method: 'GET', path: `/${objectName}`, query }),
});

export const findOneRecordTool = defineTool({
  name: 'find_one_record',
  title: 'Find one record',
  description: 'Fetch a single record of an object by its id.',
  inputSchema: {
    objectName: objectNamePluralSchema,
    recordId: recordIdSchema,
    depth: depthSchema,
  },
  annotations: { readOnlyHint: true },
  handler: (client, { objectName, recordId, depth }) =>
    client.rest({
      method: 'GET',
      path: `/${objectName}/${recordId}`,
      query: { depth },
    }),
});

export const createRecordTool = defineTool({
  name: 'create_record',
  title: 'Create record',
  description:
    'Create a single record. Provide field values in `data` (use describe_object for valid fields). Set `upsert` to update an existing record on unique-field conflict.',
  inputSchema: {
    objectName: objectNamePluralSchema,
    data: recordDataSchema,
    depth: depthSchema,
    upsert: z.boolean().optional().describe('Upsert on unique conflict.'),
  },
  handler: (client, { objectName, data, depth, upsert }) =>
    client.rest({
      method: 'POST',
      path: `/${objectName}`,
      query: { depth, upsert },
      body: data,
    }),
});

export const createManyRecordsTool = defineTool({
  name: 'create_many_records',
  title: 'Create many records',
  description:
    'Create multiple records of an object in a single batch request.',
  inputSchema: {
    objectName: objectNamePluralSchema,
    records: z
      .array(recordDataSchema)
      .min(1)
      .describe('Array of record objects to create.'),
    depth: depthSchema,
    upsert: z.boolean().optional(),
  },
  handler: (client, { objectName, records, depth, upsert }) =>
    client.rest({
      method: 'POST',
      path: `/batch/${objectName}`,
      query: { depth, upsert },
      body: records,
    }),
});

export const updateRecordTool = defineTool({
  name: 'update_record',
  title: 'Update record',
  description:
    'Update a single record by id. Only the fields present in `data` are changed.',
  inputSchema: {
    objectName: objectNamePluralSchema,
    recordId: recordIdSchema,
    data: recordDataSchema,
    depth: depthSchema,
  },
  handler: (client, { objectName, recordId, data, depth }) =>
    client.rest({
      method: 'PATCH',
      path: `/${objectName}/${recordId}`,
      query: { depth },
      body: data,
    }),
});

export const deleteRecordTool = defineTool({
  name: 'delete_record',
  title: 'Delete record',
  description:
    'Soft-delete a single record by id. The record can be brought back with restore_record.',
  inputSchema: {
    objectName: objectNamePluralSchema,
    recordId: recordIdSchema,
  },
  annotations: { destructiveHint: true },
  handler: (client, { objectName, recordId }) =>
    client.rest({ method: 'DELETE', path: `/${objectName}/${recordId}` }),
});

export const restoreRecordTool = defineTool({
  name: 'restore_record',
  title: 'Restore record',
  description: 'Restore a previously soft-deleted record by id.',
  inputSchema: {
    objectName: objectNamePluralSchema,
    recordId: recordIdSchema,
    depth: depthSchema,
  },
  handler: (client, { objectName, recordId, depth }) =>
    client.rest({
      method: 'PATCH',
      path: `/restore/${objectName}/${recordId}`,
      query: { depth },
    }),
});

export const groupByRecordsTool = defineTool({
  name: 'group_by_records',
  title: 'Group by records',
  description:
    'Aggregate/group records by one or more fields (for analytics like counts/sums per group). `groupBy` is an array of field specs, e.g. [{"stage": true}].',
  inputSchema: {
    objectName: objectNamePluralSchema,
    groupBy: z
      .array(z.record(z.string(), z.unknown()))
      .min(1)
      .describe('Array of group-by field specs, e.g. [{"stage": true}].'),
    aggregate: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('Aggregation spec, e.g. {"amountMicros": {"sum": true}}.'),
    filter: filterSchema,
    orderBy: orderBySchema,
    limit: limitSchema,
    viewId: z
      .string()
      .optional()
      .describe('Optional saved view id to scope by.'),
  },
  annotations: { readOnlyHint: true },
  handler: (client, { objectName, ...query }) =>
    client.rest({ method: 'GET', path: `/${objectName}/groupBy`, query }),
});

export const findDuplicatesTool = defineTool({
  name: 'find_duplicates',
  title: 'Find duplicates',
  description:
    'Find records that are likely duplicates, either of provided draft `data` or of existing records by `ids`.',
  inputSchema: {
    objectName: objectNamePluralSchema,
    data: z
      .array(recordDataSchema)
      .optional()
      .describe('Draft records to check for duplicates against.'),
    ids: z
      .array(recordIdSchema)
      .optional()
      .describe('Existing record ids to find duplicates of.'),
    depth: depthSchema,
  },
  annotations: { readOnlyHint: true },
  handler: (client, { objectName, data, ids, depth }) =>
    client.rest({
      method: 'POST',
      path: `/${objectName}/duplicates`,
      query: { depth },
      body: { data, ids },
    }),
});

export const mergeRecordsTool = defineTool({
  name: 'merge_records',
  title: 'Merge records',
  description:
    'Merge several records of an object into one. `conflictPriorityIndex` picks which input record wins on field conflicts; set `dryRun` to preview without writing.',
  inputSchema: {
    objectName: objectNamePluralSchema,
    ids: z.array(recordIdSchema).min(2).describe('Record ids to merge.'),
    conflictPriorityIndex: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe('Index into `ids` whose values win on conflict (default 0).'),
    dryRun: z
      .boolean()
      .optional()
      .describe('Preview the merge result without persisting.'),
    depth: depthSchema,
  },
  annotations: { destructiveHint: true },
  handler: (client, { objectName, depth, ...body }) =>
    client.rest({
      method: 'PATCH',
      path: `/${objectName}/merge`,
      query: { depth },
      body,
    }),
});

export const recordTools = [
  findRecordsTool,
  findOneRecordTool,
  createRecordTool,
  createManyRecordsTool,
  updateRecordTool,
  deleteRecordTool,
  restoreRecordTool,
  groupByRecordsTool,
  findDuplicatesTool,
  mergeRecordsTool,
];
