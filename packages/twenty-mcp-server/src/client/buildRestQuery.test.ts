import { describe, expect, it } from 'vitest';

import { buildRestQuery } from '@/client/buildRestQuery';

describe('buildRestQuery', () => {
  it('returns an empty string when there are no params', () => {
    expect(buildRestQuery()).toBe('');
    expect(buildRestQuery({})).toBe('');
  });

  it('maps camelCase params to Twenty snake_case query keys', () => {
    const query = buildRestQuery({
      filter: 'name[ilike]:%acme%',
      orderBy: 'createdAt[DescNullsLast]',
      depth: 1,
      limit: 25,
      startingAfter: 'cursor-a',
      endingBefore: 'cursor-b',
      viewId: 'view-1',
    });

    const params = new URLSearchParams(query.replace(/^\?/, ''));

    expect(params.get('filter')).toBe('name[ilike]:%acme%');
    expect(params.get('order_by')).toBe('createdAt[DescNullsLast]');
    expect(params.get('depth')).toBe('1');
    expect(params.get('limit')).toBe('25');
    expect(params.get('starting_after')).toBe('cursor-a');
    expect(params.get('ending_before')).toBe('cursor-b');
    expect(params.get('view_id')).toBe('view-1');
  });

  it('JSON-encodes groupBy and aggregate', () => {
    const query = buildRestQuery({
      groupBy: [{ stage: true }],
      aggregate: { amount: { sum: true } },
    });

    const params = new URLSearchParams(query.replace(/^\?/, ''));

    expect(params.get('group_by')).toBe('[{"stage":true}]');
    expect(params.get('aggregate')).toBe('{"amount":{"sum":true}}');
  });

  it('omits undefined params', () => {
    const query = buildRestQuery({ filter: undefined, depth: 0 });
    const params = new URLSearchParams(query.replace(/^\?/, ''));

    expect(params.has('filter')).toBe(false);
    expect(params.get('depth')).toBe('0');
  });
});
