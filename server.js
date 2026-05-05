import { createServer } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Create server
const server = createServer({
  name: "habit-mcp-server",
  version: "1.0.0",
});

// ---- TOOL 1: Echo ----
server.tool(
  "echo",
  {
    message: "string",
  },
  async ({ message }) => {
    return {
      content: [{ type: "text", text: `Echo: ${message}` }],
    };
  }
);

// ---- TOOL 2: Save Habit ----
import fs from "fs";

server.tool(
  "saveHabit",
  {
    habit: "string",
  },
  async ({ habit }) => {
    fs.appendFileSync("habits.txt", habit + "\n");
    return {
      content: [{ type: "text", text: "Habit saved!" }],
    };
  }
);

// ---- TOOL 3 (optional but good): Read Habits ----
server.tool("getHabits", {}, async () => {
  let data = "";
  try {
    data = fs.readFileSync("habits.txt", "utf-8");
  } catch {
    data = "No habits yet.";
  }

  return {
    content: [{ type: "text", text: data }],
  };
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);