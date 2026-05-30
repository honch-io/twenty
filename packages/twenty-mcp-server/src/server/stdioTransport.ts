import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { TwentyClient } from '@/client/TwentyClient';
import { type McpServerConfig } from '@/config/env';
import { createServer } from '@/server/createServer';

// Local-dev transport. The API key comes from env (TWENTY_API_KEY) since there
// is no per-request header on stdio.
export const startStdioServer = async (
  config: McpServerConfig,
): Promise<void> => {
  if (!config.stdioApiKey) {
    throw new Error(
      'TWENTY_API_KEY is required for stdio transport. Set it in the environment or use --http with a per-request Authorization header.',
    );
  }

  const client = new TwentyClient(config.baseUrl, config.stdioApiKey);
  const server = createServer(client, {
    enableRawGraphql: config.enableRawGraphql,
  });

  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error(
    `[twenty-mcp-server] stdio transport ready (target: ${config.baseUrl})`,
  );
};
