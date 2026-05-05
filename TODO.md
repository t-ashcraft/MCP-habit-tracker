# TODO

This task list is derived from SPEC.md and ARCH.md.

## Planning
- Review SPEC.md and confirm data model details (optional fields, metrics by category).
- Confirm whether MCP server and static web server should share a process.

## Backend (MCP Server)
- Add data directory initialization (data/).
- Implement JSON file helpers (read/write with default empty arrays).
- Implement MCP tools for habits:
  - list by date/category
  - create
  - update
  - delete
- Implement MCP tools for events:
  - list by date range
  - create
  - update
  - delete
- Add basic validation for date/time formats.

## Frontend
- Create public/index.html layout (Habits + Calendar sections).
- Create public/styles.css with simple, clean layout.
- Create public/app.js to:
  - fetch habits/events via MCP tools
  - render daily habits
  - render calendar events
  - handle create/edit/delete forms
- Replace freeform metrics JSON with preset category inputs:
  - food: calories, protein, fat, carbs
  - fitness: add/remove exercise rows (name, weight, reps)
  - sleep: start/end time
  - studying: add/remove class rows (name, start/end time)

## Local Hosting
- Add static file server for public/.
- Document local run steps in README.md.

## Testing
- Smoke test habit CRUD against file persistence.
- Smoke test event CRUD with time ranges.

## Documentation
- Keep SPEC.md and ARCH.md updated as features evolve.
