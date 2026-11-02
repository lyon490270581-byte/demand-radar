import { spawn } from "node:child_process";

const proc = spawn(process.execPath, ["bin/server.js"], { stdio: ["pipe", "pipe", "inherit"] });
let buf = ""; const pending = new Map(); let nextId = 1;
proc.stdout.on("data", (d) => {
  buf += d;
  let i;
  while ((i = buf.indexOf("\n")) !== -1) {
    const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
    if (!line) continue;
    const msg = JSON.parse(line);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  }
});
const rpc = (method, params) => new Promise((r) => {
  const id = nextId++; pending.set(id, r);
  proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
});
const notify = (method, params) => proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n");

const init = await rpc("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "smoke", version: "1" } });
console.log("server:", init.result.serverInfo.name, init.result.serverInfo.version);
notify("notifications/initialized", {});
const tools = await rpc("tools/list", {});
console.log("tools:", tools.result.tools.map(t => t.name).join(", "));

for (const [name, args] of [
  ["demand_stats", {}],
  ["get_hiring_orders", { with_price_only: true }],
  ["market_prices", {}],
  ["search_demand_comments", { query: "video editor" }],
  ["weekly_trends", {}],
]) {
  const r = await rpc("tools/call", { name, arguments: args });
  const txt = r.result?.content?.[0]?.text || JSON.stringify(r).slice(0, 100);
  console.log(`\n--- ${name} ---\n${txt.slice(0, 400)}`);
}
proc.kill();
console.log("\nSMOKE PASSED");
process.exit(0);
