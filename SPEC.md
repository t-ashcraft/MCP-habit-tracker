# Habit Tracker + Calendar Spec

## Overview
A local-first habit tracker and calendar app that runs in a web browser and stores data on the user’s device via a Node.js MCP server. The app tracks habits across four categories (food, fitness, sleep, studying) and includes a calendar for scheduled events with specific times. The MCP server provides tools for saving and reading local data files so the app can persist data beyond browser storage.

## Goals
- Provide a simple, fast web UI for daily habit tracking.
- Support four habit categories: food, fitness, sleep, studying.
- Include a calendar for adding events with specific start/end times.
- Persist all data locally via MCP tools backed by files on disk.
- Allow the app to run entirely on a user’s machine (no remote services).

## Non-Goals
- No user accounts or cloud sync.
- No complex analytics or visualization in the first iteration.
- No mobile app (browser access only).

## User Stories
- As a user, I can add a habit entry for today under food/fitness/sleep/studying.
- As a user, I can view habit entries by day and by category.
- As a user, I can add a calendar event with a title, date, start time, and end time.
- As a user, I can edit or delete habit entries and calendar events.
- As a user, I can use the app offline because it stores data locally.
- As a user, I can ask natural questions about my habits and events in a bottom bar.

## Data Model (Conceptual)
- HabitEntry:
  - id
  - category (food|fitness|sleep|studying)
  - date (YYYY-MM-DD)
  - notes (optional)
  - metrics (category-specific object)
    - food: { calories, protein, fat, carbs }
    - fitness: { exercises: [{ name, weight, reps }] }
    - sleep: { startTime, endTime }
    - studying: { classes: [{ name, startTime, endTime }] }
- CalendarEvent:
  - id
  - title
  - date (YYYY-MM-DD)
  - startTime (HH:MM)
  - endTime (HH:MM)
  - notes (optional)

## Persistence Requirements
- All habit entries and calendar events must be stored in local files via MCP tools.
- The UI must read/write through the MCP server, not through browser-only storage.
- Data format should be human-readable (JSON preferred).

## UI Requirements
- Web browser UI served locally.
- Main sections:
  - Habits: categorized input and daily log view.
  - Calendar: day/week view with event list and create/edit modal.
- Simple navigation between Habits and Calendar.
- Habit metrics inputs are preset per category (no JSON input).
- A bottom Q&A bar lets users ask about recent habits or upcoming events.

## MCP Server Requirements
- Extend the existing MCP server with tools for:
  - Listing habit entries by date/category.
  - Creating/updating/deleting habit entries.
  - Listing calendar events by date range.
  - Creating/updating/deleting calendar events.
- Add a tool that accepts a question and returns a succinct answer based on stored habits/events.
- File-backed storage on the local filesystem.

## References
- Architecture details and file structure are defined in ARCH.md.
- Implementation tasks are tracked in TODO.md.
