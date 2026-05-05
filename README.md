# MCP-habit-tracker

## Run
1. Install dependencies: `npm install`
2. Start the MCP server: `node server.js`

The server runs over stdio and is intended to be launched by an MCP client.
Node.js 18+ is required.

## Frontend
1. Serve the static site: `npx http-server public -p 5173`
2. Open `http://localhost:5173` in your browser.

The frontend expects an MCP client to be available in the browser as
`window.mcpClient` with a `callTool` method. If you are running this inside
an MCP-enabled host, it should inject that client automatically.

## Data Storage
- Data files are stored locally in the `data/` directory.
- Habits: `data/habits.json`
- Events: `data/events.json`