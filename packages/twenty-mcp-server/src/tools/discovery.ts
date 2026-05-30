import { z } from 'zod';

import { objectNameSingularSchema } from '@/schemas/common';
import { buildObjectsIntrospectionQuery } from '@/schemas/graphqlQueries';
import { defineTool } from '@/tools/toolDefinition';

type FieldNode = {
  id: string;
  type: string;
  name: string;
  label: string;
  description?: string | null;
  isNullable?: boolean;
  isUnique?: boolean;
  isCustom?: boolean;
  isSystem?: boolean;
  defaultValue?: unknown;
  options?: unknown;
  settings?: unknown;
};

type ObjectNode = {
  id: string;
  nameSingular: string;
  namePlural: string;
  labelSingular: string;
  labelPlural: string;
  description?: string | null;
  icon?: string | null;
  isCustom?: boolean;
  isSystem?: boolean;
  fields: { edges: { node: FieldNode }[] };
};

type ObjectsIntrospection = {
  objects: { edges: { node: ObjectNode }[] };
};

const fetchObjects = async (
  metadata: <T>(query: string) => Promise<T>,
  includeInactive: boolean,
): Promise<ObjectNode[]> => {
  const result = await metadata<ObjectsIntrospection>(
    buildObjectsIntrospectionQuery(includeInactive),
  );

  return result.objects.edges.map((edge) => edge.node);
};

export const listObjectsTool = defineTool({
  name: 'list_objects',
  title: 'List objects',
  description:
    'List all objects (standard and custom) available in the Twenty workspace, with their singular/plural REST names. Start here to discover what you can read and write. Use describe_object to inspect a specific object’s fields.',
  inputSchema: {
    includeInactive: z
      .boolean()
      .optional()
      .describe('Include deactivated objects (default false).'),
  },
  annotations: { readOnlyHint: true },
  handler: async (client, { includeInactive }) => {
    const objects = await fetchObjects(
      (query) => client.metadata(query),
      includeInactive ?? false,
    );

    return objects.map((object) => ({
      nameSingular: object.nameSingular,
      namePlural: object.namePlural,
      labelSingular: object.labelSingular,
      labelPlural: object.labelPlural,
      description: object.description ?? undefined,
      isCustom: object.isCustom ?? false,
      isSystem: object.isSystem ?? false,
      fieldCount: object.fields.edges.length,
    }));
  },
});

export const describeObjectTool = defineTool({
  name: 'describe_object',
  title: 'Describe object',
  description:
    'Return the full field schema (names, types, options) for a single object. Use this before creating/updating records so you use valid field names and types.',
  inputSchema: {
    objectName: objectNameSingularSchema,
  },
  annotations: { readOnlyHint: true },
  handler: async (client, { objectName }) => {
    const objects = await fetchObjects((query) => client.metadata(query), true);

    const match = objects.find(
      (object) =>
        object.nameSingular === objectName || object.namePlural === objectName,
    );

    if (match === undefined) {
      throw new Error(
        `No object named "${objectName}". Call list_objects to see available names.`,
      );
    }

    return {
      id: match.id,
      nameSingular: match.nameSingular,
      namePlural: match.namePlural,
      labelSingular: match.labelSingular,
      labelPlural: match.labelPlural,
      description: match.description ?? undefined,
      isCustom: match.isCustom ?? false,
      fields: match.fields.edges.map((edge) => ({
        name: edge.node.name,
        type: edge.node.type,
        label: edge.node.label,
        description: edge.node.description ?? undefined,
        isNullable: edge.node.isNullable,
        isUnique: edge.node.isUnique,
        isCustom: edge.node.isCustom,
        defaultValue: edge.node.defaultValue,
        options: edge.node.options ?? undefined,
      })),
    };
  },
});

export const discoveryTools = [listObjectsTool, describeObjectTool];
