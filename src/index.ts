#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_KEY = process.env.HEALTHCHECKS_API_KEY;
const API_URL = (process.env.HEALTHCHECKS_API_URL ?? "https://healthchecks.io/api/v3").replace(/\/+$/, "");
const PING_URL = (process.env.HEALTHCHECKS_PING_URL ?? "https://hc-ping.com").replace(/\/+$/, "");

if (!API_KEY) {
  console.error("Missing HEALTHCHECKS_API_KEY environment variable.");
  process.exit(1);
}

async function hcRequest(path: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "X-Api-Key": API_KEY as string,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  const body = text ? safeJsonParse(text) : null;

  if (!res.ok) {
    const detail = body && typeof body === "object" && "error" in (body as Record<string, unknown>)
      ? (body as Record<string, unknown>).error
      : text;
    throw new Error(`Healthchecks.io API error ${res.status}: ${detail}`);
  }

  return body;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function toContent(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

const server = new McpServer({
  name: "healthchecksio-mcp",
  version: "1.0.0",
});

server.registerTool(
  "list_checks",
  {
    title: "List checks",
    description: "List all checks in the project. Optionally filter by tag or status.",
    inputSchema: {
      tags: z.array(z.string()).optional().describe("Only return checks having all of these tags"),
      status: z.array(z.enum(["up", "down", "grace", "paused", "new"])).optional().describe("Only return checks with one of these statuses"),
    },
  },
  async ({ tags, status }) => {
    const params = new URLSearchParams();
    for (const tag of tags ?? []) params.append("tag", tag);
    for (const s of status ?? []) params.append("status", s);
    const qs = params.toString();
    const data = await hcRequest(`/checks/${qs ? `?${qs}` : ""}`);
    return toContent(data);
  }
);

server.registerTool(
  "get_check",
  {
    title: "Get check",
    description: "Get details of a single check by its UUID.",
    inputSchema: {
      uuid: z.string().describe("The check's UUID"),
    },
  },
  async ({ uuid }) => {
    const data = await hcRequest(`/checks/${uuid}`);
    return toContent(data);
  }
);

server.registerTool(
  "create_check",
  {
    title: "Create check",
    description: "Create a new check.",
    inputSchema: {
      name: z.string().optional(),
      desc: z.string().optional(),
      tags: z.string().optional().describe("Space-separated tags"),
      timeout: z.number().optional().describe("Expected period in seconds (for simple checks)"),
      grace: z.number().optional().describe("Grace period in seconds"),
      schedule: z.string().optional().describe("Cron expression (for cron-style checks)"),
      tz: z.string().optional().describe("Timezone for the schedule, e.g. Asia/Ho_Chi_Minh"),
      channels: z.string().optional().describe("Comma-separated channel UUIDs, or \"*\" for all"),
      unique: z.array(z.string()).optional().describe("Fields to enforce uniqueness on (name, tags, timeout, grace)"),
    },
  },
  async (input) => {
    const data = await hcRequest("/checks/", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return toContent(data);
  }
);

server.registerTool(
  "update_check",
  {
    title: "Update check",
    description: "Update an existing check's configuration.",
    inputSchema: {
      uuid: z.string(),
      name: z.string().optional(),
      desc: z.string().optional(),
      tags: z.string().optional(),
      timeout: z.number().optional(),
      grace: z.number().optional(),
      schedule: z.string().optional(),
      tz: z.string().optional(),
      channels: z.string().optional(),
    },
  },
  async ({ uuid, ...rest }) => {
    const data = await hcRequest(`/checks/${uuid}`, {
      method: "POST",
      body: JSON.stringify(rest),
    });
    return toContent(data);
  }
);

server.registerTool(
  "pause_check",
  {
    title: "Pause check",
    description: "Pause monitoring for a check.",
    inputSchema: {
      uuid: z.string(),
    },
  },
  async ({ uuid }) => {
    const data = await hcRequest(`/checks/${uuid}/pause`, { method: "POST" });
    return toContent(data);
  }
);

server.registerTool(
  "resume_check",
  {
    title: "Resume check",
    description: "Resume monitoring for a paused check (cron/schedule based checks only).",
    inputSchema: {
      uuid: z.string(),
    },
  },
  async ({ uuid }) => {
    const data = await hcRequest(`/checks/${uuid}/resume`, { method: "POST" });
    return toContent(data);
  }
);

server.registerTool(
  "delete_check",
  {
    title: "Delete check",
    description: "Permanently delete a check.",
    inputSchema: {
      uuid: z.string(),
    },
  },
  async ({ uuid }) => {
    const data = await hcRequest(`/checks/${uuid}`, { method: "DELETE" });
    return toContent(data);
  }
);

server.registerTool(
  "list_check_flips",
  {
    title: "List check status flips",
    description: "List status change history (up/down flips) for a check.",
    inputSchema: {
      uuid: z.string(),
      seconds: z.number().optional().describe("Limit to flips within the last N seconds"),
    },
  },
  async ({ uuid, seconds }) => {
    const qs = seconds ? `?seconds=${seconds}` : "";
    const data = await hcRequest(`/checks/${uuid}/flips/${qs}`);
    return toContent(data);
  }
);

server.registerTool(
  "list_channels",
  {
    title: "List notification channels",
    description: "List all notification channels (email, Slack, webhook, etc.) in the project.",
    inputSchema: {},
  },
  async () => {
    const data = await hcRequest("/channels/");
    return toContent(data);
  }
);

server.registerTool(
  "list_badges",
  {
    title: "List badges",
    description: "List status badge URLs for the project, per tag.",
    inputSchema: {},
  },
  async () => {
    const data = await hcRequest("/badges/");
    return toContent(data);
  }
);

server.registerTool(
  "ping",
  {
    title: "Send ping",
    description: "Send a ping (heartbeat) signal for a check. Use this to report success, failure, or manually test a check.",
    inputSchema: {
      uuid: z.string().describe("The check's UUID (ping key)"),
      state: z.enum(["success", "fail", "start", "log"]).optional().describe("Ping state; omit for a plain success ping"),
      message: z.string().optional().describe("Optional log message sent as the request body"),
      exitStatus: z.number().optional().describe("Optional exit code, appended as /<uuid>/<exitStatus>"),
    },
  },
  async ({ uuid, state, message, exitStatus }) => {
    let path = `/${uuid}`;
    if (state && state !== "success") path += `/${state}`;
    if (typeof exitStatus === "number") path += `/${exitStatus}`;
    const res = await fetch(`${PING_URL}${path}`, {
      method: "POST",
      body: message ?? "",
    });
    const text = await res.text();
    return toContent({ status: res.status, body: text });
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
