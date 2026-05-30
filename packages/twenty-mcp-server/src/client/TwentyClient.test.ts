import { afterEach, describe, expect, it, vi } from 'vitest';

import { TwentyApiError } from '@/client/errors';
import { TwentyClient } from '@/client/TwentyClient';

const mockFetch = (response: {
  ok?: boolean;
  status?: number;
  body: unknown;
}) => {
  const fetchMock = vi.fn(
    (..._args: unknown[]): Promise<Response> =>
      Promise.resolve({
        ok: response.ok ?? true,
        status: response.status ?? 200,
        text: () => Promise.resolve(JSON.stringify(response.body)),
      } as unknown as Response),
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

describe('TwentyClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sends the bearer token and parses GraphQL data', async () => {
    const fetchMock = mockFetch({
      body: { data: { currentWorkspace: { id: '1' } } },
    });
    const client = new TwentyClient('http://localhost:3000', 'secret-key');

    const data = await client.metadata('query { currentWorkspace { id } }');

    expect(data).toEqual({ currentWorkspace: { id: '1' } });

    const [url, init] = fetchMock.mock.calls[0];

    expect(url).toBe('http://localhost:3000/metadata');
    expect((init as RequestInit).method).toBe('POST');
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer secret-key',
      'Content-Type': 'application/json',
    });
  });

  it('throws TwentyApiError when GraphQL returns errors', async () => {
    mockFetch({ body: { errors: [{ message: 'nope' }] } });
    const client = new TwentyClient('http://localhost:3000', 'k');

    await expect(client.graphql('query { x }')).rejects.toBeInstanceOf(
      TwentyApiError,
    );
  });

  it('builds REST URLs with the query string and returns the body', async () => {
    const fetchMock = mockFetch({ body: { data: { companies: [] } } });
    const client = new TwentyClient('http://localhost:3000/', 'k');

    await client.rest({
      method: 'GET',
      path: '/companies',
      query: { filter: 'name[ilike]:%a%', limit: 5 },
    });

    const [url, init] = fetchMock.mock.calls[0];

    expect(url).toBe(
      'http://localhost:3000/rest/companies?filter=name%5Bilike%5D%3A%25a%25&limit=5',
    );
    expect((init as RequestInit).method).toBe('GET');
  });

  it('throws TwentyApiError on non-2xx REST responses', async () => {
    mockFetch({ ok: false, status: 404, body: { messages: ['not found'] } });
    const client = new TwentyClient('http://localhost:3000', 'k');

    await expect(
      client.rest({ method: 'GET', path: '/companies/x' }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
