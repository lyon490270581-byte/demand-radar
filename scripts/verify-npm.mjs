import { spawn } from "node:child_process";
// verify the published npm package actually serves MCP (spawn npx, handshake, one call)
const proc = spawn("npx", ["-y", "demand-radar-mcp@0.1.0"], { stdio: ["pipe", "pipe", "inherit"], shell: true });
let buf = ""; const pending = new Map(); let id = 1;
proc.stdout.on("data", (d) => {
  buf += d;
  let i;
  while ((i = buf.indexOf("\n")) !== -1) {
    const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    } catch {}
  }
});
const rpc = (m, p) => new Promise((r) => { const i = id++; pending.set(i, r); proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: i, method: m, params: p }) + "\n"); });
await new Promise((r) => setTimeout(r, 25000)); // wait for npx download+start
const init = await rpc("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "t", version: "1" } });
console.log("published pkg server:", init?.result?.serverInfo?.name, init?.result?.serverInfo?.version);
const r2 = await rpc("tools/call", { name: "market_prices", arguments: {} });
console.log((r2?.result?.content?.[0]?.text || "no result").slice(0, 200));
proc.kill(); process.exit(0);
