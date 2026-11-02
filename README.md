# demand-radar-mcp

**Reddit demand intelligence for your AI assistant.** Ask Claude/Cursor what people wish existed, what they're hiring for, and what the market pays.

Built from **6,803 posts + 25,500 comments** across 17 demand subreddits (r/SomebodyMakeThis, r/forhire, r/Entrepreneur, r/HireaWriter, r/DesignJobs...) covering Aug–Nov 2026, via the Arctic Shift research API.

## Tools

| Tool | What it answers |
|---|---|
| `demand_stats` | Which categories have the highest demand-intent density |
| `search_posts` | "What are people saying about inventory sync?" |
| `search_demand_comments` | "What do people wish existed for podcasters?" |
| `get_hiring_orders` | Latest outsourcing orders, filtered, with prices |
| `market_prices` | **Median + range rates**: $20/hr median, $40 one-off median, $400/script median... |
| `weekly_trends` | Demand-intent density over time |

## Install

**Remote (no install):**
```jsonc
{ "mcpServers": { "demand-radar": { "serverUrl": "https://demand-radar.onrender.com/mcp" } } }
```

**Local (stdio):**
```jsonc
{ "mcpServers": { "demand-radar": { "command": "npx", "args": ["-y", "demand-radar-mcp"] } } }
```

## Example questions your AI can now answer

- "What services are small business owners desperately asking for on Reddit?"
- "What's the going rate for YouTube script writers?"
- "Show me recent paid tasks for video editors"
- "Is demand for podcast editing growing?"

## Data provenance & limits

- Source: public Reddit data via Arctic Shift (research API), read-only, no redistribution of raw content
- Window: 2026-08-30 → 2026-11-02, refreshed periodically
- Demand classification: regex intent-matching (seeking/wishing/recommending phrasings)

MIT license.
