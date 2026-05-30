import { isDefined } from 'twenty-shared/utils';

import { buildRestQuery, type RestQueryParams } from '@/client/buildRestQuery';
import { TwentyApiError } from '@/client/errors';

type GraphqlEndpoint = 'graphql' | 'metadata';
type RestMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export type RestRequest = {
  method: RestMethod;
  // Path under /rest, with a leading slash, e.g. "/companies" or "/companies/{id}".
  path: string;
  query?: RestQueryParams;
  body?: unknown;
};

// Thin, per-request gateway over Twenty's public HTTP APIs. Constructed with the
// caller's own API key so the server stays stateless re: credentials. Mirrors the
// request pattern in packages/twenty-zapier/src/utils/requestDb.ts.
export class TwentyClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private jsonHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  // Core data GraphQL.
  async graphql<TData = Record<string, unknown>>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<TData> {
    return this.executeGraphql<TData>('graphql', query, variables);
  }

  // Schema / metadata GraphQL (objects, fields, webhooks).
  async metadata<TData = Record<string, unknown>>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<TData> {
    return this.executeGraphql<TData>('metadata', query, variables);
  }

  private async executeGraphql<TData>(
    endpoint: GraphqlEndpoint,
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<TData> {
    const url = `${this.baseUrl}/${endpoint}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: this.jsonHeaders(),
        body: JSON.stringify(
          isDefined(variables) ? { query, variables } : { query },
        ),
      });
    } catch (cause) {
      throw new TwentyApiError(
        `Failed to reach Twenty at ${url}: ${(cause as Error).message}`,
        { endpoint },
      );
    }

    const result = (await this.parseJson(response)) as {
      data?: TData;
      errors?: unknown;
    };

    if (isDefined(result?.errors)) {
      throw new TwentyApiError('GraphQL request returned errors', {
        endpoint,
        status: response.status,
        graphqlErrors: result.errors,
      });
    }

    if (!response.ok) {
      throw new TwentyApiError(
        `Request failed with status ${response.status}`,
        {
          endpoint,
          status: response.status,
          body: result,
        },
      );
    }

    return result.data as TData;
  }

  // REST data API. Returns the parsed JSON body (callers unwrap the envelope).
  async rest<TData = Record<string, unknown>>({
    method,
    path,
    query,
    body,
  }: RestRequest): Promise<TData> {
    const endpoint = `rest${path}`;
    const url = `${this.baseUrl}/rest${path}${buildRestQuery(query)}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: this.jsonHeaders(),
        body: isDefined(body) ? JSON.stringify(body) : undefined,
      });
    } catch (cause) {
      throw new TwentyApiError(
        `Failed to reach Twenty at ${url}: ${(cause as Error).message}`,
        { endpoint },
      );
    }

    const parsed = await this.parseJson(response);

    if (!response.ok) {
      throw new TwentyApiError(
        `${method} ${path} failed with status ${response.status}`,
        { endpoint, status: response.status, body: parsed },
      );
    }

    return parsed as TData;
  }

  async openApi(kind: 'core' | 'metadata'): Promise<unknown> {
    const endpoint = `open-api/${kind}`;
    const response = await fetch(`${this.baseUrl}/open-api/${kind}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new TwentyApiError(
        `Failed to fetch OpenAPI spec (${response.status})`,
        { endpoint, status: response.status },
      );
    }

    return this.parseJson(response);
  }

  // GraphQL multipart upload (graphql-upload spec) for file fields. The
  // uploadFilesFieldFile mutation lives on the metadata endpoint.
  async uploadFile({
    endpoint = 'metadata',
    query,
    variables,
    file,
    filename,
  }: {
    endpoint?: GraphqlEndpoint;
    query: string;
    variables: Record<string, unknown>;
    file: Buffer;
    filename: string;
  }): Promise<Record<string, unknown>> {
    const form = new FormData();

    form.set(
      'operations',
      JSON.stringify({ query, variables: { ...variables, file: null } }),
    );
    form.set('map', JSON.stringify({ '0': ['variables.file'] }));
    form.set('0', new Blob([new Uint8Array(file)]), filename);

    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'POST',
      // No Content-Type: fetch sets the multipart boundary itself.
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    });

    const result = (await this.parseJson(response)) as {
      data?: Record<string, unknown>;
      errors?: unknown;
    };

    if (isDefined(result?.errors)) {
      throw new TwentyApiError('File upload returned GraphQL errors', {
        endpoint,
        status: response.status,
        graphqlErrors: result.errors,
      });
    }

    if (!response.ok) {
      throw new TwentyApiError(`File upload failed (${response.status})`, {
        endpoint,
        status: response.status,
        body: result,
      });
    }

    return result.data ?? {};
  }

  private async parseJson(response: Response): Promise<unknown> {
    const text = await response.text();

    if (text.length === 0) {
      return undefined;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
}
