import { z } from 'zod';

import { defineTool } from '@/tools/toolDefinition';

// Escape hatch for anything the typed tools don't cover. Disabled by default
// (TWENTY_MCP_ENABLE_RAW_GRAPHQL) because it bypasses the curated tool surface.
export const rawGraphqlTool = defineTool({
  name: 'raw_graphql',
  title: 'Raw GraphQL',
  description:
    'Execute an arbitrary GraphQL query/mutation against the core (`graphql`) or `metadata` endpoint. Use only when no dedicated tool fits.',
  inputSchema: {
    endpoint: z
      .enum(['graphql', 'metadata'])
      .describe('Which GraphQL endpoint to hit.'),
    query: z.string().min(1).describe('The GraphQL document.'),
    variables: z.record(z.string(), z.unknown()).optional(),
  },
  handler: (client, { endpoint, query, variables }) =>
    endpoint === 'metadata'
      ? client.metadata(query, variables)
      : client.graphql(query, variables),
});
