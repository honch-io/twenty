import { type McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { type TwentyClient } from '@/client/TwentyClient';
import { discoveryTools } from '@/tools/discovery';
import { fileTools } from '@/tools/files';
import { metadataTools } from '@/tools/metadataMutations';
import { rawGraphqlTool } from '@/tools/raw';
import { recordTools } from '@/tools/records';
import { type AnyToolDefinition, runToolHandler } from '@/tools/toolDefinition';
import { webhookTools } from '@/tools/webhooks';

export const getToolDefinitions = (options: {
  enableRawGraphql: boolean;
}): AnyToolDefinition[] => {
  const tools: AnyToolDefinition[] = [
    ...discoveryTools,
    ...recordTools,
    ...metadataTools,
    ...webhookTools,
    ...fileTools,
  ];

  if (options.enableRawGraphql) {
    tools.push(rawGraphqlTool);
  }

  return tools;
};

// Bind every tool definition to a concrete (per-request) TwentyClient and
// register it on the MCP server.
export const registerTools = (
  server: McpServer,
  client: TwentyClient,
  tools: AnyToolDefinition[],
): void => {
  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: tool.annotations,
      },
      (args: Record<string, unknown>) => runToolHandler(tool, client, args),
    );
  }
};
