#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL = "https://api.fda.gov";
const USER_AGENT = "mcp-fda/1.0.0 (https://github.com/PetrefiedThunder/mcp-fda)";
const RATE_LIMIT_MS = 250; // ~4 req/s (openFDA allows 4/sec without key, 240/min with key)

let lastRequestTime = 0;

async function rateLimitedFetch(url: string): Promise<any> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - elapsed));
  }
  lastRequestTime = Date.now();

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`openFDA API error: ${res.status} ${res.statusText} — ${body}`);
  }
  return res.json();
}

function buildUrl(endpoint: string, params: Record<string, string | undefined>): string {
  const apiKey = process.env.OPENFDA_API_KEY;
  const url = new URL(`${BASE_URL}${endpoint}.json`);
  if (apiKey) url.searchParams.set("api_key", apiKey);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, v);
  }
  return url.toString();
}

const server = new McpServer({
  name: "mcp-fda",
  version: "1.0.0",
});

// Drug adverse events
server.tool(
  "search_drug_events",
  "Search FDA drug adverse event reports (FAERS). Find reports of side effects and safety issues.",
  {
    query: z.string().describe("OpenFDA search query, e.g. 'patient.drug.openfda.brand_name:\"aspirin\"' or 'serious:1'"),
    limit: z.number().min(1).max(100).default(10),
    skip: z.number().min(0).default(0),
  },
  async ({ query, limit, skip }) => {
    const url = buildUrl("/drug/event", {
      search: query,
      limit: String(limit),
      skip: String(skip),
    });
    const data = await rateLimitedFetch(url);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  }
);

// Drug labeling
server.tool(
  "search_drug_labels",
  "Search FDA drug labeling/package inserts. Find dosage, warnings, indications, contraindications.",
  {
    query: z.string().describe("Search query, e.g. 'openfda.brand_name:\"lipitor\"' or 'indications_and_usage:\"diabetes\"'"),
    limit: z.number().min(1).max(100).default(5),
  },
  async ({ query, limit }) => {
    const url = buildUrl("/drug/label", {
      search: query,
      limit: String(limit),
    });
    const data = await rateLimitedFetch(url);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  }
);

// Drug recalls/enforcement
server.tool(
  "search_drug_recalls",
  "Search FDA drug recall enforcement reports.",
  {
    query: z.string().describe("Search query, e.g. 'reason_for_recall:\"contamination\"' or 'openfda.brand_name:\"metformin\"'"),
    limit: z.number().min(1).max(100).default(10),
  },
  async ({ query, limit }) => {
    const url = buildUrl("/drug/enforcement", {
      search: query,
      limit: String(limit),
    });
    const data = await rateLimitedFetch(url);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  }
);

// Device adverse events
server.tool(
  "search_device_events",
  "Search FDA medical device adverse event reports (MAUDE).",
  {
    query: z.string().describe("Search query, e.g. 'device.generic_name:\"pacemaker\"' or 'mdr_text.text:\"malfunction\"'"),
    limit: z.number().min(1).max(100).default(10),
  },
  async ({ query, limit }) => {
    const url = buildUrl("/device/event", {
      search: query,
      limit: String(limit),
    });
    const data = await rateLimitedFetch(url);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  }
);

// Food adverse events
server.tool(
  "search_food_events",
  "Search FDA food adverse event reports (CAERS).",
  {
    query: z.string().describe("Search query, e.g. 'products.name_brand:\"monster energy\"' or 'reactions:\"nausea\"'"),
    limit: z.number().min(1).max(100).default(10),
  },
  async ({ query, limit }) => {
    const url = buildUrl("/food/event", {
      search: query,
      limit: String(limit),
    });
    const data = await rateLimitedFetch(url);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  }
);

// Food recalls
server.tool(
  "search_food_recalls",
  "Search FDA food recall enforcement reports.",
  {
    query: z.string().describe("Search query, e.g. 'reason_for_recall:\"salmonella\"' or 'city:\"los angeles\"'"),
    limit: z.number().min(1).max(100).default(10),
  },
  async ({ query, limit }) => {
    const url = buildUrl("/food/enforcement", {
      search: query,
      limit: String(limit),
    });
    const data = await rateLimitedFetch(url);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  }
);

// Count/aggregate endpoint
server.tool(
  "count_field",
  "Get counts/aggregations for a field in any openFDA endpoint. Useful for top drugs, common side effects, etc.",
  {
    endpoint: z.enum([
      "/drug/event", "/drug/label", "/drug/enforcement",
      "/device/event", "/device/enforcement",
      "/food/event", "/food/enforcement",
    ]).describe("The openFDA endpoint to query"),
    countField: z.string().describe("Field to count, e.g. 'patient.reaction.reactionmeddrapt.exact' for top reactions"),
    query: z.string().optional().describe("Optional search filter"),
    limit: z.number().min(1).max(1000).default(10),
  },
  async ({ endpoint, countField, query, limit }) => {
    const url = buildUrl(endpoint, {
      search: query,
      count: countField,
      limit: String(limit),
    });
    const data = await rateLimitedFetch(url);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
