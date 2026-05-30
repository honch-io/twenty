import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { type TwentyClient } from '@/client/TwentyClient';
import { getToolDefinitions, registerTools } from '@/tools/registerTools';

export const SERVER_NAME = 'twenty-mcp-server';
export const SERVER_VERSION = '0.1.0';

const INSTRUCTIONS = [
  'This server controls a Twenty CRM workspace.',
  'Discovery first: call list_objects to see available objects (standard and custom), then describe_object to learn a specific object’s fields and types before reading or writing records.',
  'Records are manipulated with the generic find_records/find_one_record/create_record/update_record/delete_record tools, which all take an `objectName` (the plural REST name, e.g. "companies").',
  'For analytics (counts/sums per group, rankings) use group_by_records.',
  'Schema changes (new objects, fields, relations) use the create_object/create_field/create_relation tools.',
].join(' ');

export type CreateServerOptions = {
  enableRawGraphql: boolean;
};

// Builds an MCP server whose tools are bound to a single (per-request) Twenty
// client, so credentials never live on the server itself.
export const createServer = (
  client: TwentyClient,
  options: CreateServerOptions,
): McpServer => {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { instructions: INSTRUCTIONS },
  );

  registerTools(server, client, getToolDefinitions(options));

  return server;
};
