# healthchecksio-mcp

MCP server cho Healthchecks.io API. Cho phép Claude quản lý checks, channels, badges, gửi ping.

## Cài đặt

```bash
npm install
npm run build
```

## Config env

- `HEALTHCHECKS_API_KEY` (bắt buộc) — API key lấy ở Settings > API Access trên healthchecks.io.
- `HEALTHCHECKS_API_URL` (optional) — mặc định `https://healthchecks.io/api/v3`. Đổi nếu self-host.
- `HEALTHCHECKS_PING_URL` (optional) — mặc định `https://hc-ping.com`. Đổi nếu self-host.

## Đăng ký với Claude Code

```bash
claude mcp add healthchecksio -e HEALTHCHECKS_API_KEY=your-key -- node /Users/huyntq/Documents/healthchecksio-mcp/build/index.js
```

Hoặc thêm vào `.mcp.json` / `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "healthchecksio": {
      "command": "node",
      "args": ["/Users/huyntq/Documents/healthchecksio-mcp/build/index.js"],
      "env": {
        "HEALTHCHECKS_API_KEY": "your-key"
      }
    }
  }
}
```

## Tools

- `list_checks` — list checks, filter tag/status
- `get_check` — chi tiết 1 check
- `create_check` — tạo check mới
- `update_check` — sửa check
- `pause_check` / `resume_check`
- `delete_check`
- `list_check_flips` — lịch sử up/down
- `list_channels` — kênh notify
- `list_badges` — badge URLs
- `ping` — gửi heartbeat ping (success/fail/start/log)
