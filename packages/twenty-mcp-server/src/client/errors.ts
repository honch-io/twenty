// A single error type for every Twenty API failure (REST or GraphQL), carrying
// enough context for tool handlers to turn it into a useful MCP error message.
export class TwentyApiError extends Error {
  readonly endpoint: string;
  readonly status?: number;
  readonly graphqlErrors?: unknown;
  readonly body?: unknown;

  constructor(
    message: string,
    options: {
      endpoint: string;
      status?: number;
      graphqlErrors?: unknown;
      body?: unknown;
    },
  ) {
    super(message);
    this.name = 'TwentyApiError';
    this.endpoint = options.endpoint;
    this.status = options.status;
    this.graphqlErrors = options.graphqlErrors;
    this.body = options.body;
  }
}

// Map a thrown error into a human + model readable string. Keeps common cases
// friendly so the calling model can self-correct instead of seeing a raw dump.
export const formatErrorForMcp = (error: unknown): string => {
  if (error instanceof TwentyApiError) {
    if (error.status === 401 || error.status === 403) {
      return `Authentication failed (${error.status}): the Twenty API key is missing, invalid, or lacks permission. ${error.message}`;
    }
    if (error.status === 404) {
      return `Not found (404): ${error.message}`;
    }

    const details =
      error.graphqlErrors !== undefined
        ? ` GraphQL errors: ${JSON.stringify(error.graphqlErrors)}`
        : error.body !== undefined
          ? ` Response: ${JSON.stringify(error.body)}`
          : '';

    return `Twenty API error on ${error.endpoint}${
      error.status !== undefined ? ` (status ${error.status})` : ''
    }: ${error.message}.${details}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};
