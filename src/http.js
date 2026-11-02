// HTTP entry (Render: Streamable HTTP at /mcp, landing at /)
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { buildServer } from "../bin/shared.js";

const LANDING = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>demand-radar MCP</title><meta name="description" content="Reddit demand intelligence MCP: 6.8k posts, 3.6k demand comments, 550 hiring orders with market prices."><style>
*{box-sizing:border-box;margin:0}body{font-family:ui-monospace,Menlo,monospace;background:#0d1117;color:#e6edf3;line-height:1.6;padding:48px 20px}
.w{max-width:720px;margin:0 auto}h1{color:#58a6ff;font-size:26px}h2{font-size:15px;margin:28px 0 8px}
.tag{display:inline-block;background:#1f6feb33;color:#79c0ff;border:1px solid #1f6feb;border-radius:99px;padding:2px 12px;font-size:12px;margin:8px 6px 0 0}
li{padding:5px 0;border-bottom:1px solid #21262d}code{background:#161b22;border:1px solid #30363d;border-radius:6px;padding:2px 8px;font-size:13px}
.pre{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:14px;margin:8px 0;overflow:auto}
a{color:#58a6ff}</style></head><body><div class="w">
<h1>demand-radar <span style="color:#8b949e;font-size:15px">MCP v0.1.0</span></h1>
<span class="tag">MCP server</span><span class="tag">6,803 posts</span><span class="tag">3,630 demand comments</span><span class="tag">557 hiring orders</span><span class="tag">162 price points</span>
<h2>What it gives your AI</h2><ul>
<li><b>demand_stats</b> - category demand density + trends overview</li>
<li><b>search_posts</b> - find posts by keyword/category</li>
<li><b>search_demand_comments</b> - what people wish existed / ask for</li>
<li><b>get_hiring_orders</b> - latest outsourcing orders with USD prices</li>
<li><b>market_prices</b> - median/range rates by unit (per script, per hour...)</li>
<li><b>weekly_trends</b> - demand-intent density time series</li>
</ul>
<h2>Connect</h2><div class="pre">URL: https://demand-radar.onrender.com/mcp</div>
Or run locally: <code>npx -y demand-radar-mcp</code>
<h2>Source</h2>
Data: 17 demand subreddits (r/SomebodyMakeThis, r/forhire, r/Entrepreneur...) via Arctic Shift research API, Aug-Nov 2026.<br>
GitHub: <a href="https://github.com/lyon490270581-byte/demand-radar">lyon490270581-byte/demand-radar</a>
</div></body></html>`;

const app = express();
app.use(express.json({ limit: "2mb" }));
app.get("/", (_q, res) => res.type("html").send(LANDING));
app.get("/health", (_q, res) => res.json({ ok: true, server: "demand-radar-mcp", version: "0.1.0" }));

app.post("/mcp", async (req, res) => {
  try {
    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => { transport.close(); server.close(); });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
const no = async (_q, res) => res.status(405).json({ error: "stateless server" });
app.get("/mcp", no); app.delete("/mcp", no);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`demand-radar-mcp http on :${port}/mcp`));
