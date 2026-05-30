import { randomUUID } from 'node:crypto';
import {
  createServer as createHttpServer,
  type IncomingMessage,
  type Server as HttpServer,
  type ServerResponse,
} from 'node:http';

import { type McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { isDefined } from 'twenty-shared/utils';

import { TwentyClient } from '@/client/TwentyClient';
import { type McpServerConfig } from '@/config/env';
import { createServer } from '@/server/createServer';
import { extractBearerToken, getHeaderValue } from '@/server/httpAuth';

const MCP_PATH = '/mcp';
const SESSION_HEADER = 'mcp-session-id';

type Session = {
  transport: StreamableHTTPServerTransport;
  server: McpServer;
};

const readJsonBody = (request: IncomingMessage): Promise<unknown> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');

      if (raw.length === 0) {
        resolve(undefined);

        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });

const applyCors = (
  request: IncomingMessage,
  response: ServerResponse,
  allowedOrigins: string[],
): void => {
  const origin = getHeaderValue(request, 'origin');

  if (isDefined(origin) && allowedOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
  }

  response.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, DELETE, OPTIONS',
  );
  response.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, X-Twenty-Base-Url',
  );
  response.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
};

const sendJsonRpcError = (
  response: ServerResponse,
  status: number,
  message: string,
  extraHeaders: Record<string, string> = {},
): void => {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    ...extraHeaders,
  });
  response.end(
    JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32000, message },
      id: null,
    }),
  );
};

export const startHttpServer = (config: McpServerConfig): HttpServer => {
  const sessions = new Map<string, Session>();

  const httpServer = createHttpServer((request, response) => {
    void handleRequest(request, response).catch((error: unknown) => {
      console.error('[twenty-mcp-server] request error:', error);

      if (!response.headersSent) {
        sendJsonRpcError(response, 500, 'Internal server error');
      }
    });
  });

  const handleRequest = async (
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> => {
    applyCors(request, response, config.allowedOrigins);

    if (request.method === 'OPTIONS') {
      response.writeHead(204);
      response.end();

      return;
    }

    const url = new URL(request.url ?? '/', 'http://localhost');

    if (url.pathname !== MCP_PATH) {
      sendJsonRpcError(response, 404, `Not found. Use ${MCP_PATH}.`);

      return;
    }

    const sessionId = getHeaderValue(request, SESSION_HEADER);

    if (request.method === 'POST') {
      const body = await readJsonBody(request);
      const existing = isDefined(sessionId)
        ? sessions.get(sessionId)
        : undefined;

      if (isDefined(existing)) {
        await existing.transport.handleRequest(request, response, body);

        return;
      }

      if (isDefined(sessionId)) {
        sendJsonRpcError(response, 404, 'Unknown or expired session.');

        return;
      }

      if (!isInitializeRequest(body)) {
        sendJsonRpcError(
          response,
          400,
          'No session: the first request must be an MCP initialize request.',
        );

        return;
      }

      const token = extractBearerToken(request.headers.authorization);

      if (!isDefined(token)) {
        sendJsonRpcError(
          response,
          401,
          'Missing or invalid Authorization header. Send "Authorization: Bearer <TWENTY_API_KEY>".',
          { 'WWW-Authenticate': 'Bearer' },
        );

        return;
      }

      const baseUrl =
        getHeaderValue(request, 'x-twenty-base-url') ?? config.baseUrl;
      const client = new TwentyClient(baseUrl, token);
      const server = createServer(client, {
        enableRawGraphql: config.enableRawGraphql,
      });

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          sessions.set(newSessionId, { transport, server });
        },
      });

      transport.onclose = () => {
        if (isDefined(transport.sessionId)) {
          sessions.delete(transport.sessionId);
        }
      };

      await server.connect(transport);
      await transport.handleRequest(request, response, body);

      return;
    }

    // GET (SSE stream) and DELETE (session teardown) require an existing session.
    const existing = isDefined(sessionId) ? sessions.get(sessionId) : undefined;

    if (!isDefined(existing)) {
      sendJsonRpcError(response, 400, 'Missing or unknown Mcp-Session-Id.');

      return;
    }

    if (request.method === 'GET' || request.method === 'DELETE') {
      await existing.transport.handleRequest(request, response);

      return;
    }

    sendJsonRpcError(response, 405, 'Method not allowed.');
  };

  httpServer.listen(config.httpPort, '127.0.0.1', () => {
    // stderr so it never pollutes any stdio JSON-RPC stream.
    console.error(
      `[twenty-mcp-server] HTTP transport listening on http://127.0.0.1:${config.httpPort}${MCP_PATH} (target: ${config.baseUrl})`,
    );
  });

  return httpServer;
};
