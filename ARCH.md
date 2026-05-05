# Architecture

This document defines the technical architecture and conventions for the app described in SPEC.md.

## Runtime
- Node.js MCP server handles all persistence and exposes MCP tools.
- A local web server hosts the frontend assets.
- Frontend communicates with MCP server via MCP client calls.

## File Structure
- server.js (MCP server entry point)
- public/ (static frontend assets)
  - index.html
  - styles.css
  - app.js
- data/ (local storage on disk)
  - habits.json
  - events.json
- SPEC.md
- ARCH.md
- TODO.md

## Data Storage
- JSON files stored in data/.
- habits.json stores an array of HabitEntry objects.
- events.json stores an array of CalendarEvent objects.
- MCP tools are the only writers of these files.

## MCP Tools (Planned)
- habits.list
- habits.create
- habits.update
- habits.delete
- events.list
- events.create
- events.update
- events.delete

## Frontend Architecture
- Vanilla HTML/CSS/JS (no framework in the first iteration).
- app.js orchestrates UI state and MCP calls.
- UI state is derived from MCP responses (no source-of-truth in browser storage).

## File Naming Conventions
- Lowercase with dashes for markdown files (existing SPEC.md, ARCH.md, TODO.md are exceptions by design).
- Lowercase with dots for JS/CSS/HTML (app.js, styles.css, index.html).
- Data files in data/ use lowercase with .json.

## API and Data Conventions
- All dates: YYYY-MM-DD.
- Times: 24-hour HH:MM.
- IDs: UUID v4 or timestamp-based unique string.

## Local Hosting
- Use a simple static file server in Node.js for public/.
- The MCP server and static server can run in the same process or separate processes.

## References
- Product requirements are defined in SPEC.md.
