import { z } from 'zod';

import { recordIdSchema } from '@/schemas/common';
import {
  CREATE_WEBHOOK_MUTATION,
  DELETE_WEBHOOK_MUTATION,
  LIST_WEBHOOKS_QUERY,
} from '@/schemas/graphqlQueries';
import { defineTool } from '@/tools/toolDefinition';

export const listWebhooksTool = defineTool({
  name: 'list_webhooks',
  title: 'List webhooks',
  description: 'List all webhooks configured in the workspace.',
  inputSchema: {},
  annotations: { readOnlyHint: true },
  handler: (client) => client.metadata(LIST_WEBHOOKS_QUERY),
});

export const createWebhookTool = defineTool({
  name: 'create_webhook',
  title: 'Create webhook',
  description:
    'Create a webhook that POSTs to `targetUrl` on the given operations. Operations look like "company.created", "person.updated", or "*.*" for all.',
  inputSchema: {
    targetUrl: z.string().url().describe('HTTPS endpoint to receive events.'),
    operations: z
      .array(z.string())
      .min(1)
      .describe('e.g. ["company.created","opportunity.updated"].'),
    description: z.string().optional(),
    secret: z
      .string()
      .optional()
      .describe('Optional signing secret sent with deliveries.'),
  },
  handler: (client, args) =>
    client.metadata(CREATE_WEBHOOK_MUTATION, { input: args }),
});

export const deleteWebhookTool = defineTool({
  name: 'delete_webhook',
  title: 'Delete webhook',
  description: 'Delete a webhook by id.',
  inputSchema: {
    webhookId: recordIdSchema,
  },
  annotations: { destructiveHint: true },
  handler: (client, { webhookId }) =>
    client.metadata(DELETE_WEBHOOK_MUTATION, { id: webhookId }),
});

export const webhookTools = [
  listWebhooksTool,
  createWebhookTool,
  deleteWebhookTool,
];
