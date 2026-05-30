import { describe, expect, it, vi } from 'vitest';

import { type TwentyClient } from '@/client/TwentyClient';
import { TwentyApiError } from '@/client/errors';
import {
  createRecordTool,
  deleteRecordTool,
  findRecordsTool,
  updateRecordTool,
} from '@/tools/records';
import { runToolHandler } from '@/tools/toolDefinition';

const makeClient = (restImpl: () => Promise<unknown>) =>
  ({ rest: vi.fn(restImpl) }) as unknown as TwentyClient & {
    rest: ReturnType<typeof vi.fn>;
  };

describe('record tools', () => {
  it('find_records issues a GET to /{objectName} with query params', async () => {
    const client = makeClient(async () => Promise.resolve({ data: {} }));

    await findRecordsTool.handler(client, {
      objectName: 'companies',
      filter: 'name[ilike]:%a%',
    });

    expect(client.rest).toHaveBeenCalledWith({
      method: 'GET',
      path: '/companies',
      query: { filter: 'name[ilike]:%a%' },
    });
  });

  it('create_record POSTs the data as the body', async () => {
    const client = makeClient(async () => Promise.resolve({ data: {} }));

    await createRecordTool.handler(client, {
      objectName: 'companies',
      data: { name: 'Acme' },
    });

    expect(client.rest).toHaveBeenCalledWith({
      method: 'POST',
      path: '/companies',
      query: { depth: undefined, upsert: undefined },
      body: { name: 'Acme' },
    });
  });

  it('update_record PATCHes /{objectName}/{id}', async () => {
    const client = makeClient(async () => Promise.resolve({ data: {} }));

    await updateRecordTool.handler(client, {
      objectName: 'companies',
      recordId: '11111111-1111-1111-1111-111111111111',
      data: { employees: 42 },
    });

    expect(client.rest).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/companies/11111111-1111-1111-1111-111111111111',
      query: { depth: undefined },
      body: { employees: 42 },
    });
  });

  it('delete_record DELETEs /{objectName}/{id}', async () => {
    const client = makeClient(async () => Promise.resolve({ data: {} }));

    await deleteRecordTool.handler(client, {
      objectName: 'companies',
      recordId: '11111111-1111-1111-1111-111111111111',
    });

    expect(client.rest).toHaveBeenCalledWith({
      method: 'DELETE',
      path: '/companies/11111111-1111-1111-1111-111111111111',
    });
  });

  it('runToolHandler wraps success as text content', async () => {
    const client = makeClient(async () =>
      Promise.resolve({ data: { companies: [{ id: '1' }] } }),
    );

    const result = await runToolHandler(findRecordsTool, client, {
      objectName: 'companies',
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('companies');
  });

  it('runToolHandler reports errors as isError content', async () => {
    const client = makeClient(async () =>
      Promise.reject(
        new TwentyApiError('boom', { endpoint: 'rest/companies', status: 500 }),
      ),
    );

    const result = await runToolHandler(findRecordsTool, client, {
      objectName: 'companies',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('boom');
  });
});
