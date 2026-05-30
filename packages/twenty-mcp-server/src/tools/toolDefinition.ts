import { type z, type ZodRawShape } from 'zod';

import { type TwentyClient } from '@/client/TwentyClient';
import { formatErrorForMcp } from '@/client/errors';

export type ToolAnnotations = {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
};

// MCP tool result shape (a subset of the SDK's CallToolResult that we produce).
export type McpToolResult = {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
};

// Type-erased definition stored in the registry and handed to the MCP server.
export type AnyToolDefinition = {
  name: string;
  title?: string;
  description: string;
  inputSchema: ZodRawShape;
  annotations?: ToolAnnotations;
  handler: (
    client: TwentyClient,
    args: Record<string, unknown>,
  ) => Promise<unknown>;
};

// Authoring helper: keeps each tool's handler strongly typed against its zod
// shape, while erasing the type at the single registry boundary.
export const defineTool = <TShape extends ZodRawShape>(definition: {
  name: string;
  title?: string;
  description: string;
  inputSchema: TShape;
  annotations?: ToolAnnotations;
  handler: (
    client: TwentyClient,
    args: z.infer<z.ZodObject<TShape>>,
  ) => Promise<unknown>;
}): AnyToolDefinition => definition as unknown as AnyToolDefinition;

const stringifyResult = (result: unknown): string => {
  if (result === undefined || result === null) {
    return 'Operation completed successfully.';
  }

  if (typeof result === 'string') {
    return result;
  }

  return JSON.stringify(result, null, 2);
};

// Runs a tool handler and packages success/failure into MCP content. Kept free
// of any MCP SDK import so it stays trivially unit-testable.
export const runToolHandler = async (
  definition: AnyToolDefinition,
  client: TwentyClient,
  args: Record<string, unknown>,
): Promise<McpToolResult> => {
  try {
    const result = await definition.handler(client, args);

    return { content: [{ type: 'text', text: stringifyResult(result) }] };
  } catch (error) {
    return {
      content: [{ type: 'text', text: formatErrorForMcp(error) }],
      isError: true,
    };
  }
};
