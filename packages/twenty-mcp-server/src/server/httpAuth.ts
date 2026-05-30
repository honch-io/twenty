import { type IncomingMessage } from 'node:http';

// Extract the Twenty API key from the Authorization header. Returns undefined
// when absent or malformed. Kept separate so it can be unit-tested without a
// running HTTP server.
export const extractBearerToken = (
  authorizationHeader: string | string[] | undefined,
): string | undefined => {
  const header = Array.isArray(authorizationHeader)
    ? authorizationHeader[0]
    : authorizationHeader;

  if (header === undefined) {
    return undefined;
  }

  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const token = match?.[1]?.trim();

  return token !== undefined && token.length > 0 ? token : undefined;
};

export const getHeaderValue = (
  request: IncomingMessage,
  name: string,
): string | undefined => {
  const value = request.headers[name.toLowerCase()];

  return Array.isArray(value) ? value[0] : value;
};
