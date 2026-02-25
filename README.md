# mcp-fda

MCP server for the [openFDA API](https://open.fda.gov). Search drug adverse events, drug labels, recalls, device reports, and food safety data. No API key required (optional key for higher rate limits).

## Tools

| Tool | Description |
|------|-------------|
| `search_drug_events` | Drug adverse event reports (FAERS) — side effects, safety signals |
| `search_drug_labels` | Drug labeling/package inserts — dosage, warnings, indications |
| `search_drug_recalls` | Drug recall enforcement reports |
| `search_device_events` | Medical device adverse event reports (MAUDE) |
| `search_food_events` | Food adverse event reports (CAERS) |
| `search_food_recalls` | Food recall enforcement reports |
| `count_field` | Aggregate/count any field across any endpoint |

## Install

```bash
npm install
npm run build
```

## Usage with Claude Desktop

```json
{
  "mcpServers": {
    "fda": {
      "command": "node",
      "args": ["/path/to/mcp-fda/dist/index.js"]
    }
  }
}
```

## Optional: API Key

For higher rate limits (240 requests/min vs 40/min), get a free key at https://open.fda.gov/apis/authentication/ and set:

```
OPENFDA_API_KEY=your_key_here
```

## Query Syntax

openFDA uses Elasticsearch-style queries:
- `openfda.brand_name:"aspirin"` — exact brand name
- `patient.reaction.reactionmeddrapt:"nausea"` — adverse reaction
- `serious:1` — serious events only
- `reason_for_recall:"contamination"` — recall reasons
- Combine with `+AND+`, `+OR+`

See https://open.fda.gov/apis/query-syntax/ for full docs.

## Rate Limits

- Without key: ~40 requests/minute
- With key: ~240 requests/minute

Rate limiting is enforced automatically.

## License

MIT
