import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

// Load a local .env when present (dev convenience); real deploys inject env directly.
loadDotenv();

const envSchema = z.object({
  TWENTY_BASE_URL: z.string().url().default('http://localhost:3000'),
  TWENTY_MCP_HTTP_PORT: z.coerce.number().int().positive().default(3010),
  TWENTY_MCP_ALLOWED_ORIGINS: z.string().default(''),
  TWENTY_MCP_ENABLE_RAW_GRAPHQL: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  // Only required in stdio mode; HTTP mode reads the key from the request header.
  TWENTY_API_KEY: z.string().optional(),
});

export type McpServerConfig = {
  baseUrl: string;
  httpPort: number;
  allowedOrigins: string[];
  enableRawGraphql: boolean;
  stdioApiKey?: string;
};

export const loadConfig = (): McpServerConfig => {
  const parsed = envSchema.parse(process.env);

  return {
    baseUrl: parsed.TWENTY_BASE_URL.replace(/\/$/, ''),
    httpPort: parsed.TWENTY_MCP_HTTP_PORT,
    allowedOrigins: parsed.TWENTY_MCP_ALLOWED_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
    enableRawGraphql: parsed.TWENTY_MCP_ENABLE_RAW_GRAPHQL,
    stdioApiKey: parsed.TWENTY_API_KEY,
  };
};
