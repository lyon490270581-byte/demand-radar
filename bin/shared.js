// demand-radar MCP: shared server builder (stdio + http both use this)
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(HERE, "..", "data");
const load = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8"));

const posts = load("posts.json");            // 6803
const comments = load("comments.json");      // 3630 demand-filtered
const hiring = load("hiring.json");          // 557 orders, 162 with prices
const trends = load("trends.json");          // weekly
const categories = load("categories.json");  // per-category stats

const has = (s, q) => (s || "").toLowerCase().includes(q.toLowerCase());

export function buildServer() {
  const server = new McpServer({ name: "demand-radar-mcp", version: "0.1.0" });
  const ok = (text) => ({ content: [{ type: "text", text }] });
  const wrap = (fn) => async (a) => {
    try { return ok(await fn(a)); } catch (e) { return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true }; }
  };

  server.tool("demand_stats", "Overview: dataset size, per-category demand density, weekly trend summary.",
    {}, wrap(() => {
      const t = trends[trends.length - 1] || {};
      return [
        `Dataset: ${posts.length} posts | ${comments.length} demand comments | ${hiring.length} hiring orders (${hiring.filter(h=>h.prices.length).length} with explicit pricing)`,
        `Coverage: ${categories.length} categories across 17 subreddits (Aug-Nov 2026)`,
        ``,
        `Categories (demand density = % of comments expressing demand):`,
        ...categories.sort((a,b)=>b.density_pct-a.density_pct).map(c => `  ${c.cat}: ${c.posts} posts, ${c.comments} comments, ${c.density_pct}% demand density`),
        ``,
        `Latest week ${t.week}: ${t.posts} posts, ${t.density_pct}% demand density`,
      ].join("\n");
    }));

  server.tool("search_posts", "Search posts by keyword (title+body). Filter by category optionally.",
    { query: z.string().describe("keyword, e.g. 'podcast editing' or 'inventory sync'"),
      category: z.string().optional().describe("one of: hiring, ideas, business_pain, video, podcast, creator, dev, build_requests") },
    wrap(({ query, category }) => {
      const hits = posts
        .filter(p => (!category || p.cat === category) && (has(p.title, query) || has(p.text, query)))
        .sort((a, b) => b.score - a.score).slice(0, 15);
      if (!hits.length) return `No posts match "${query}".`;
      return hits.map(p =>
        `[${p.score}pts|${p.nc}c|r/${p.sub}] ${p.title}\n  ${p.text.slice(0, 150)}`).join("\n\n");
    }));

  server.tool("search_demand_comments", "Search demand-intent comments: what people wish existed / ask recommendations for.",
    { query: z.string().describe("keyword, e.g. 'video editor' or 'landing page'") },
    wrap(({ query }) => {
      const hits = comments
        .filter(c => has(c.body, query)).sort((a, b) => b.score - a.score).slice(0, 15);
      if (!hits.length) return `No demand comments match "${query}".`;
      return hits.map(c => `[${c.score}pts|r/${c.sub}] ${c.body}`).join("\n\n");
    }));

  server.tool("get_hiring_orders", "Latest hiring/outsourcing orders (with extracted USD prices when present).",
    { with_price_only: z.boolean().default(false).describe("only orders with explicit pricing"),
      niche: z.string().optional().describe("keyword filter, e.g. 'writer', 'video', 'design'") },
    wrap(({ with_price_only, niche }) => {
      let hits = hiring.slice().sort((a, b) => b.utc - a.utc);
      if (with_price_only) hits = hits.filter(h => h.prices.length);
      if (niche) hits = hits.filter(h => has(h.title, niche) || has(h.text, niche));
      hits = hits.slice(0, 15);
      if (!hits.length) return "No orders match.";
      return hits.map(h => {
        const pr = h.prices.length ? ` PRICE: ${h.prices.map(p => `$${p.usd}${p.per ? "/" + p.per : ""}`).join(", ")}` : "";
        return `[r/${h.sub}|${h.score}pts]${pr} ${h.title}\n  ${h.text.slice(0, 140)}`;
      }).join("\n\n");
    }));

  server.tool("market_prices", "Market rate statistics extracted from hiring orders (median/range by unit).",
    {}, wrap(() => {
      const byUnit = {};
      for (const h of hiring) for (const p of h.prices) {
        const u = p.per || "one-off";
        (byUnit[u] = byUnit[u] || []).push(p.usd);
      }
      const med = (a) => { const s = a.slice().sort((x,y)=>x-y); return s[s.length>>1]; };
      return Object.entries(byUnit).sort((a,b)=>b[1].length-a[1].length).map(([u, arr]) =>
        `${u}: median $${med(arr)} | range $${Math.min(...arr)}-$${Math.max(...arr)} | n=${arr.length}`).join("\n") ||
        "no price data";
    }));

  server.tool("weekly_trends", "Weekly demand trend: posts, comments, demand-intent density.",
    {}, wrap(() => trends.map(t =>
      `${t.week}: posts=${t.posts} comments=${t.comments} demand_density=${t.density_pct}%`).join("\n")));

  return server;
}
