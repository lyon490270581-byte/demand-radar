#!/usr/bin/env node
// stdio entry (npx demand-radar-mcp)
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buildServer } from "./shared.js";

const server = buildServer();
await server.connect(new StdioServerTransport());
