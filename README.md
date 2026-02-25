# mcp-fda

Access FDA data on drugs, devices, food recalls, and adverse events via openFDA.

## Tools

| Tool | Description |
|------|-------------|
| `search_drug_events` | Search FDA drug adverse event reports (FAERS). Find reports of side effects and safety issues. |
| `search_drug_labels` | Search FDA drug labeling/package inserts. Find dosage, warnings, indications, contraindications. |
| `search_drug_recalls` | Search FDA drug recall enforcement reports. |
| `search_device_events` | Search FDA medical device adverse event reports (MAUDE). |
| `search_food_events` | Search FDA food adverse event reports (CAERS). |
| `search_food_recalls` | Search FDA food recall enforcement reports. |
| `count_field` | Get counts/aggregations for a field in any openFDA endpoint. Useful for top drugs, common side effects, etc. |

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENFDA_API_KEY` | Yes | openfda api key |

## Installation

```bash
git clone https://github.com/PetrefiedThunder/mcp-fda.git
cd mcp-fda
npm install
npm run build
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "fda": {
      "command": "node",
      "args": ["/path/to/mcp-fda/dist/index.js"],
      "env": {
        "OPENFDA_API_KEY": "your-openfda-api-key"
      }
    }
  }
}
```

## Usage with npx

```bash
npx mcp-fda
```

## License

MIT
