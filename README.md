# healthchecksio-mcp

English · [Tiếng Việt](./README-vi.md)

MCP server for the Healthchecks.io API. Lets Claude manage checks, channels, badges, and send pings.

## Install (dev)

```bash
pnpm install
pnpm run build
```

(npm also works: `npm install && npm run build`)

## Env config

- `HEALTHCHECKS_API_KEY` (required) — API key from Settings > API Access on healthchecks.io.
- `HEALTHCHECKS_API_URL` (optional) — defaults to `https://healthchecks.io/api/v3`. Change if self-hosting.
- `HEALTHCHECKS_PING_URL` (optional) — defaults to `https://hc-ping.com`. Change if self-hosting.

## Register with Claude Code

Install straight from GitHub, no clone needed (pnpm preferred):

```bash
claude mcp add healthchecksio -e HEALTHCHECKS_API_KEY=your-key -- pnpm dlx github:nguyenhuy158/healthchecksio-mcp
```

npm also works:

```bash
claude mcp add healthchecksio -e HEALTHCHECKS_API_KEY=your-key -- npx -y github:nguyenhuy158/healthchecksio-mcp
```

Or run from a local build, adding to `.mcp.json` / `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "healthchecksio": {
      "command": "node",
      "args": ["/path/to/healthchecksio-mcp/build/index.js"],
      "env": {
        "HEALTHCHECKS_API_KEY": "your-key"
      }
    }
  }
}
```

## Tools

- `list_checks` — list checks, filter by tag/status
- `get_check` — get a single check's details
- `create_check` — create a new check
- `update_check` — update a check
- `pause_check` / `resume_check`
- `delete_check`
- `list_check_flips` — up/down status history
- `list_channels` — notification channels
- `list_badges` — badge URLs
- `ping` — send a heartbeat ping (success/fail/start/log)
