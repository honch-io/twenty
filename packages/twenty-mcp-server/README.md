# twenty-mcp-server

A standard [Model Context Protocol](https://modelcontextprotocol.io) server for **Twenty CRM**. It lets any MCP-capable client — Claude, OpenAI, Gemini, Cursor, etc. — control all of Twenty: read/write records of every standard and custom object, run aggregations, manage the data model (objects, fields, relations), webhooks, and file uploads.

It talks to Twenty's public HTTP APIs (`/rest`, `/graphql`, `/metadata`) — it does not import server internals — so it works against any Twenty instance (self-hosted or cloud).

## How it authenticates

The server is **stateless about credentials**: each MCP client supplies its own Twenty API key.

- **HTTP transport (primary):** every request must include `Authorization: Bearer <TWENTY_API_KEY>`. The server builds a per-session client from that key and forwards calls to Twenty. No key is stored on the server. Optionally send `X-Twenty-Base-Url` to target a different Twenty instance per session.
- **stdio transport (local dev only):** the key comes from the `TWENTY_API_KEY` env var.

Create an API key in Twenty under **Settings → APIs**.

## Tools

| Group | Tools |
|---|---|
| Discovery | `list_objects`, `describe_object` |
| Records | `find_records`, `find_one_record`, `create_record`, `create_many_records`, `update_record`, `delete_record`, `restore_record`, `group_by_records`, `find_duplicates`, `merge_records` |
| Data model | `create_object`, `update_object`, `create_field`, `update_field`, `create_relation` |
| Webhooks | `list_webhooks`, `create_webhook`, `delete_webhook` |
| Files | `upload_file` |
| Escape hatch | `raw_graphql` (only when `TWENTY_MCP_ENABLE_RAW_GRAPHQL=true`) |

The record tools are object-agnostic — they take an `objectName` argument — so custom objects are supported automatically. Models should call `list_objects` then `describe_object` before reading/writing.

## Configuration (env)

| Var | Default | Purpose |
|---|---|---|
| `TWENTY_BASE_URL` | `http://localhost:3000` | Twenty instance URL |
| `TWENTY_MCP_HTTP_PORT` | `3010` | HTTP transport port (bound to `127.0.0.1`) |
| `TWENTY_MCP_ALLOWED_ORIGINS` | _(empty)_ | Comma-separated CORS origin allowlist (browsers only) |
| `TWENTY_MCP_ENABLE_RAW_GRAPHQL` | `false` | Enable the `raw_graphql` tool |
| `TWENTY_API_KEY` | — | stdio transport only |

## Run

```bash
npx nx build twenty-mcp-server

# HTTP (hosted)
node packages/twenty-mcp-server/dist/cli.mjs --http

# stdio (local dev)
TWENTY_API_KEY=<key> node packages/twenty-mcp-server/dist/cli.mjs
```

## Hosting on a Mac mini (public HTTPS)

The server binds to `127.0.0.1` only. Expose it publicly with a tunnel so provider *cloud* connectors can reach it.

1. **Keep it running** — copy `deploy/com.twenty.mcp-server.plist` to `~/Library/LaunchAgents/`, edit the node path / package path / env, then:
   ```bash
   launchctl load -w ~/Library/LaunchAgents/com.twenty.mcp-server.plist
   ```
2. **Public HTTPS** — install `cloudflared`, create a named tunnel, and use `deploy/cloudflared-config.example.yml` to map `https://twenty-mcp.example.com` → `http://127.0.0.1:3010`:
   ```bash
   cloudflared tunnel --config ./cloudflared-config.yml run
   ```

Your MCP endpoint is then `https://twenty-mcp.example.com/mcp`.

## Connecting clients

All clients point at `https://<your-host>/mcp` and send the Twenty API key as a bearer token.

**Claude (Desktop / claude.ai custom connector)** — add a remote MCP connector with URL `https://<your-host>/mcp` and the Twenty API key as the bearer token.

**OpenAI (Responses API)**
```ts
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'List my 5 newest companies in Twenty.',
  tools: [
    {
      type: 'mcp',
      server_label: 'twenty',
      server_url: 'https://<your-host>/mcp',
      headers: { Authorization: 'Bearer <TWENTY_API_KEY>' },
    },
  ],
});
```

**Gemini (SDK)** — connect an MCP client to `https://<your-host>/mcp` with an `Authorization: Bearer <TWENTY_API_KEY>` header and pass it via `mcpToTool(...)`.

## Develop & test

```bash
npx nx test twenty-mcp-server       # vitest unit tests
npx nx typecheck twenty-mcp-server
npx nx lint twenty-mcp-server
```
