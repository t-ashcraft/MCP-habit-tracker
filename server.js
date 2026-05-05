import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { z } from "zod";
import http from "http";
import { fileURLToPath } from "url";

// Create server
const server = new McpServer({
  name: "habit-mcp-server",
  version: "1.0.0",
});

const dataDir = path.join(process.cwd(), "data");
const habitsFile = path.join(dataDir, "habits.json");
const eventsFile = path.join(dataDir, "events.json");
const publicDir = path.join(process.cwd(), "public");

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

const listHabits = async ({ date, category }) => {
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

  return { habits: filtered };
};

const createHabit = async ({ category, date, notes, metrics }) => {
  if (!validCategories.has(category)) {
    return { error: "Invalid category." };
  }
  if (!isValidDate(date)) {
    return { error: "Invalid date format." };
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

  return { habit: entry };
};

const updateHabit = async ({ id, category, date, notes, metrics }) => {
  const habits = await readJsonFile(habitsFile);
  const index = habits.findIndex((entry) => entry.id === id);

  if (index === -1) {
    return { error: "Habit not found." };
  }

  if (category && !validCategories.has(category)) {
    return { error: "Invalid category." };
  }
  if (date && !isValidDate(date)) {
    return { error: "Invalid date format." };
  }

  habits[index] = {
    ...habits[index],
    category: category ?? habits[index].category,
    date: date ?? habits[index].date,
    notes: notes ?? habits[index].notes,
    metrics: metrics ?? habits[index].metrics,
  };

  await writeJsonFile(habitsFile, habits);
  return { habit: habits[index] };
};

const deleteHabit = async ({ id }) => {
  const habits = await readJsonFile(habitsFile);
  const nextHabits = habits.filter((entry) => entry.id !== id);

  if (nextHabits.length === habits.length) {
    return { error: "Habit not found." };
  }

  await writeJsonFile(habitsFile, nextHabits);
  return { success: true };
};

const listEvents = async ({ startDate, endDate }) => {
  if (startDate && !isValidDate(startDate)) {
    return { error: "Invalid startDate format." };
  }
  if (endDate && !isValidDate(endDate)) {
    return { error: "Invalid endDate format." };
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

  return { events: filtered };
};

const createEvent = async ({ title, date, startTime, endTime, notes }) => {
  if (!title) {
    return { error: "Title is required." };
  }
  if (!isValidDate(date)) {
    return { error: "Invalid date format." };
  }
  if (!isValidTimeRange(startTime, endTime)) {
    return { error: "Invalid time format." };
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

  return { event: entry };
};

const updateEvent = async ({ id, title, date, startTime, endTime, notes }) => {
  const events = await readJsonFile(eventsFile);
  const index = events.findIndex((entry) => entry.id === id);

  if (index === -1) {
    return { error: "Event not found." };
  }

  if (title !== undefined && title.length === 0) {
    return { error: "Title is required." };
  }
  if (date && !isValidDate(date)) {
    return { error: "Invalid date format." };
  }
  if ((startTime || endTime) && !isValidTimeRange(startTime, endTime)) {
    return { error: "Invalid time format." };
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
  return { event: events[index] };
};

const deleteEvent = async ({ id }) => {
  const events = await readJsonFile(eventsFile);
  const nextEvents = events.filter((entry) => entry.id !== id);

  if (nextEvents.length === events.length) {
    return { error: "Event not found." };
  }

  await writeJsonFile(eventsFile, nextEvents);
  return { success: true };
};

server.tool(
  "habits.list",
  "List habit entries by date or category",
  {
    date: z.string().optional(),
    category: z.string().optional(),
  },
  async ({ date, category }) => {
    const result = await listHabits({ date, category });
    return toTextResponse(result);
  }
);

server.tool(
  "habits.create",
  "Create a habit entry",
  {
    category: z.string(),
    date: z.string(),
    notes: z.string().optional(),
    metrics: z.record(z.any()).optional(),
  },
  async ({ category, date, notes, metrics }) => {
    const result = await createHabit({ category, date, notes, metrics });
    return toTextResponse(result);
  }
);

server.tool(
  "habits.update",
  "Update a habit entry",
  {
    id: z.string(),
    category: z.string().optional(),
    date: z.string().optional(),
    notes: z.string().optional(),
    metrics: z.record(z.any()).optional(),
  },
  async ({ id, category, date, notes, metrics }) => {
    const result = await updateHabit({ id, category, date, notes, metrics });
    return toTextResponse(result);
  }
);

server.tool(
  "habits.delete",
  "Delete a habit entry",
  {
    id: z.string(),
  },
  async ({ id }) => {
    const result = await deleteHabit({ id });
    return toTextResponse(result);
  }
);

server.tool(
  "events.list",
  "List calendar events by date range",
  {
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  },
  async ({ startDate, endDate }) => {
    const result = await listEvents({ startDate, endDate });
    return toTextResponse(result);
  }
);

server.tool(
  "events.create",
  "Create a calendar event",
  {
    title: z.string(),
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    notes: z.string().optional(),
  },
  async ({ title, date, startTime, endTime, notes }) => {
    const result = await createEvent({ title, date, startTime, endTime, notes });
    return toTextResponse(result);
  }
);

server.tool(
  "events.update",
  "Update a calendar event",
  {
    id: z.string(),
    title: z.string().optional(),
    date: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    notes: z.string().optional(),
  },
  async ({ id, title, date, startTime, endTime, notes }) => {
    const result = await updateEvent({
      id,
      title,
      date,
      startTime,
      endTime,
      notes,
    });
    return toTextResponse(result);
  }
);

server.tool(
  "events.delete",
  "Delete a calendar event",
  {
    id: z.string(),
  },
  async ({ id }) => {
    const result = await deleteEvent({ id });
    return toTextResponse(result);
  }
);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);

const readRequestBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
};

const sendText = (res, statusCode, payload) => {
  res.writeHead(statusCode, { "Content-Type": "text/plain" });
  res.end(payload);
};

const sendNotFound = (res) => {
  sendText(res, 404, "Not found");
};

const getContentType = (filePath) => {
  const ext = path.extname(filePath);
  switch (ext) {
    case ".html":
      return "text/html";
    case ".css":
      return "text/css";
    case ".js":
      return "application/javascript";
    case ".json":
      return "application/json";
    case ".svg":
      return "image/svg+xml";
    default:
      return "text/plain";
  }
};

const serveStatic = async (req, res, pathname) => {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(publicDir, safePath));

  if (!filePath.startsWith(publicDir)) {
    sendNotFound(res);
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": getContentType(filePath) });
    res.end(content);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      sendNotFound(res);
      return;
    }
    sendText(res, 500, "Server error");
  }
};

const handleApiRequest = async (req, res, url) => {
  if (url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true });
    return true;
  }

  if (url.pathname === "/api/habits" && req.method === "GET") {
    const result = await listHabits({
      date: url.searchParams.get("date") || undefined,
      category: url.searchParams.get("category") || undefined,
    });
    sendJson(res, 200, result);
    return true;
  }

  if (url.pathname === "/api/habits" && req.method === "POST") {
    const body = await readRequestBody(req);
    const result = await createHabit(body);
    sendJson(res, result.error ? 400 : 200, result);
    return true;
  }

  if (url.pathname.startsWith("/api/habits/") && req.method === "PUT") {
    const id = url.pathname.split("/").pop();
    const body = await readRequestBody(req);
    const result = await updateHabit({ id, ...body });
    sendJson(res, result.error ? 400 : 200, result);
    return true;
  }

  if (url.pathname.startsWith("/api/habits/") && req.method === "DELETE") {
    const id = url.pathname.split("/").pop();
    const result = await deleteHabit({ id });
    sendJson(res, result.error ? 404 : 200, result);
    return true;
  }

  if (url.pathname === "/api/events" && req.method === "GET") {
    const result = await listEvents({
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
    });
    sendJson(res, 200, result);
    return true;
  }

  if (url.pathname === "/api/events" && req.method === "POST") {
    const body = await readRequestBody(req);
    const result = await createEvent(body);
    sendJson(res, result.error ? 400 : 200, result);
    return true;
  }

  if (url.pathname.startsWith("/api/events/") && req.method === "PUT") {
    const id = url.pathname.split("/").pop();
    const body = await readRequestBody(req);
    const result = await updateEvent({ id, ...body });
    sendJson(res, result.error ? 400 : 200, result);
    return true;
  }

  if (url.pathname.startsWith("/api/events/") && req.method === "DELETE") {
    const id = url.pathname.split("/").pop();
    const result = await deleteEvent({ id });
    sendJson(res, result.error ? 404 : 200, result);
    return true;
  }

  return false;
};

const startLocalBridge = (port = 5173) => {
  const serverBase = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const handled = await handleApiRequest(req, res, url);
      if (handled) {
        return;
      }
      await serveStatic(req, res, url.pathname);
    } catch (error) {
      sendText(res, 500, "Server error");
    }
  });

  serverBase.on("error", (error) => {
    if (error && error.code === "EADDRINUSE") {
      console.error(
        `Port ${port} is already in use. Set PORT to a free port, e.g. PORT=5174 node server.js`
      );
      return;
    }

    console.error("Local web bridge error:", error);
  });

  serverBase.listen(port, () => {
    console.log(`Local web bridge running on http://localhost:${port}`);
  });
};

const isDirectRun = () => {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  const entryUrl = new URL(`file://${path.resolve(entry)}`);
  return import.meta.url === entryUrl.href;
};

if (isDirectRun()) {
  startLocalBridge(Number(process.env.PORT) || 5173);
}