import { isDefined } from 'twenty-shared/utils';

// Tool args use camelCase; Twenty's REST API expects snake_case for several
// params. This is the single place that mapping lives.
export type RestQueryParams = {
  filter?: string;
  orderBy?: string;
  depth?: 0 | 1;
  limit?: number;
  startingAfter?: string;
  endingBefore?: string;
  groupBy?: unknown;
  aggregate?: unknown;
  viewId?: string;
  upsert?: boolean;
};

export const buildRestQuery = (params: RestQueryParams = {}): string => {
  const search = new URLSearchParams();

  if (isDefined(params.filter)) search.set('filter', params.filter);
  if (isDefined(params.orderBy)) search.set('order_by', params.orderBy);
  if (isDefined(params.depth)) search.set('depth', String(params.depth));
  if (isDefined(params.limit)) search.set('limit', String(params.limit));
  if (isDefined(params.startingAfter))
    search.set('starting_after', params.startingAfter);
  if (isDefined(params.endingBefore))
    search.set('ending_before', params.endingBefore);
  if (isDefined(params.groupBy))
    search.set('group_by', JSON.stringify(params.groupBy));
  if (isDefined(params.aggregate))
    search.set('aggregate', JSON.stringify(params.aggregate));
  if (isDefined(params.viewId)) search.set('view_id', params.viewId);
  if (isDefined(params.upsert)) search.set('upsert', String(params.upsert));

  const queryString = search.toString();

  return queryString.length > 0 ? `?${queryString}` : '';
};
