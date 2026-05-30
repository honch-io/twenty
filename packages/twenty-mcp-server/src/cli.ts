import { loadConfig } from '@/config/env';
import { startHttpServer } from '@/server/httpTransport';
import { startStdioServer } from '@/server/stdioTransport';

const main = async (): Promise<void> => {
  const config = loadConfig();

  const useHttp =
    process.argv.includes('--http') ||
    process.env.TWENTY_MCP_TRANSPORT === 'http';

  if (useHttp) {
    startHttpServer(config);

    return;
  }

  await startStdioServer(config);
};

main().catch((error: unknown) => {
  console.error('[twenty-mcp-server] fatal:', error);
  process.exit(1);
});
