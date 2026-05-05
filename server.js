import { createServer } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// Create server
const server = createServer({
  name: "habit-mcp-server",
  version: "1.0.0",
});

const dataDir = path.join(process.cwd(), "data");
const habitsFile = path.join(dataDir, "habits.json");
const eventsFile = path.join(dataDir, "events.json");

const validCategories = new Set(["food", "fitness", "sleep", "studying"]);

const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isValidTime = (value) => /^\d{2}:\d{2}$/.test(value);

const isValidTimeRange = (startTime, endTime) => {
  if (!isValidTime(startTime) || !isValidTime(endTime)) {
    return false;
  }

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  if (
    startHour > 23 ||
    endHour > 23 ||
    startMinute > 59 ||
    endMinute > 59
  ) {
    return false;
  }

  return true;
};

const generateId = () => {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const ensureDataDir = async () => {
  await fs.mkdir(dataDir, { recursive: true });
};

const readJsonFile = async (filePath) => {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
};

const writeJsonFile = async (filePath, data) => {
  const payload = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, payload, "utf-8");
};

const toTextResponse = (payload) => ({
  content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
});

await ensureDataDir();

server.tool(
  "habits.list",
  {
    date: "string",
    category: "string",
  },
  async ({ date, category }) => {
    const habits = await readJsonFile(habitsFile);

    const filtered = habits.filter((entry) => {
      if (date && entry.date !== date) {
        return false;
      }
      if (category && entry.category !== category) {
        return false;
      }
      return true;
    });

    return toTextResponse({ habits: filtered });
  }
);

server.tool(
  "habits.create",
  {
    category: "string",
    date: "string",
    notes: "string",
    metrics: "object",
  },
  async ({ category, date, notes, metrics }) => {
    if (!validCategories.has(category)) {
      return toTextResponse({ error: "Invalid category." });
    }
    if (!isValidDate(date)) {
      return toTextResponse({ error: "Invalid date format." });
    }

    const habits = await readJsonFile(habitsFile);
    const entry = {
      id: generateId(),
      category,
      date,
      notes: notes ?? "",
      metrics: metrics ?? {},
    };

    habits.push(entry);
    await writeJsonFile(habitsFile, habits);

    return toTextResponse({ habit: entry });
  }
);

server.tool(
  "habits.update",
  {
    id: "string",
    category: "string",
    date: "string",
    notes: "string",
    metrics: "object",
  },
  async ({ id, category, date, notes, metrics }) => {
    const habits = await readJsonFile(habitsFile);
    const index = habits.findIndex((entry) => entry.id === id);

    if (index === -1) {
      return toTextResponse({ error: "Habit not found." });
    }

    if (category && !validCategories.has(category)) {
      return toTextResponse({ error: "Invalid category." });
    }
    if (date && !isValidDate(date)) {
      return toTextResponse({ error: "Invalid date format." });
    }

    habits[index] = {
      ...habits[index],
      category: category ?? habits[index].category,
      date: date ?? habits[index].date,
      notes: notes ?? habits[index].notes,
      metrics: metrics ?? habits[index].metrics,
    };

    await writeJsonFile(habitsFile, habits);
    return toTextResponse({ habit: habits[index] });
  }
);

server.tool(
  "habits.delete",
  {
    id: "string",
  },
  async ({ id }) => {
    const habits = await readJsonFile(habitsFile);
    const nextHabits = habits.filter((entry) => entry.id !== id);

    if (nextHabits.length === habits.length) {
      return toTextResponse({ error: "Habit not found." });
    }

    await writeJsonFile(habitsFile, nextHabits);
    return toTextResponse({ success: true });
  }
);

server.tool(
  "events.list",
  {
    startDate: "string",
    endDate: "string",
  },
  async ({ startDate, endDate }) => {
    if (startDate && !isValidDate(startDate)) {
      return toTextResponse({ error: "Invalid startDate format." });
    }
    if (endDate && !isValidDate(endDate)) {
      return toTextResponse({ error: "Invalid endDate format." });
    }

    const events = await readJsonFile(eventsFile);

    const filtered = events.filter((event) => {
      if (startDate && event.date < startDate) {
        return false;
      }
      if (endDate && event.date > endDate) {
        return false;
      }
      return true;
    });

    return toTextResponse({ events: filtered });
  }
);

server.tool(
  "events.create",
  {
    title: "string",
    date: "string",
    startTime: "string",
    endTime: "string",
    notes: "string",
  },
  async ({ title, date, startTime, endTime, notes }) => {
    if (!title) {
      return toTextResponse({ error: "Title is required." });
    }
    if (!isValidDate(date)) {
      return toTextResponse({ error: "Invalid date format." });
    }
    if (!isValidTimeRange(startTime, endTime)) {
      return toTextResponse({ error: "Invalid time format." });
    }

    const events = await readJsonFile(eventsFile);
    const entry = {
      id: generateId(),
      title,
      date,
      startTime,
      endTime,
      notes: notes ?? "",
    };

    events.push(entry);
    await writeJsonFile(eventsFile, events);

    return toTextResponse({ event: entry });
  }
);

server.tool(
  "events.update",
  {
    id: "string",
    title: "string",
    date: "string",
    startTime: "string",
    endTime: "string",
    notes: "string",
  },
  async ({ id, title, date, startTime, endTime, notes }) => {
    const events = await readJsonFile(eventsFile);
    const index = events.findIndex((entry) => entry.id === id);

    if (index === -1) {
      return toTextResponse({ error: "Event not found." });
    }

    if (title !== undefined && title.length === 0) {
      return toTextResponse({ error: "Title is required." });
    }
    if (date && !isValidDate(date)) {
      return toTextResponse({ error: "Invalid date format." });
    }
    if ((startTime || endTime) && !isValidTimeRange(startTime, endTime)) {
      return toTextResponse({ error: "Invalid time format." });
    }

    events[index] = {
      ...events[index],
      title: title ?? events[index].title,
      date: date ?? events[index].date,
      startTime: startTime ?? events[index].startTime,
      endTime: endTime ?? events[index].endTime,
      notes: notes ?? events[index].notes,
    };

    await writeJsonFile(eventsFile, events);
    return toTextResponse({ event: events[index] });
  }
);

server.tool(
  "events.delete",
  {
    id: "string",
  },
  async ({ id }) => {
    const events = await readJsonFile(eventsFile);
    const nextEvents = events.filter((entry) => entry.id !== id);

    if (nextEvents.length === events.length) {
      return toTextResponse({ error: "Event not found." });
    }

    await writeJsonFile(eventsFile, nextEvents);
    return toTextResponse({ success: true });
  }
);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);