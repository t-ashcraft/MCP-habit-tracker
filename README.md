# MCP-habit-tracker

## Run
1. Install dependencies: `npm install`
2. Start the MCP server + local web bridge: `node server.js`

The server runs over stdio and is intended to be launched by an MCP client.
Node.js 18+ is required.

## Frontend
1. Open `http://localhost:5173` in Firefox (or any browser).

If port 5173 is busy, run with a different port, e.g. `PORT=5174 node server.js`
and open `http://localhost:5174`.

The frontend will use the local bridge (HTTP API) automatically when no
MCP client is injected. If you run inside an MCP-enabled host, it will use
`window.mcpClient` instead.

## Data Storage
- Data files are stored locally in the `data/` directory.
- Habits: `data/habits.json`
- Events: `data/events.json`