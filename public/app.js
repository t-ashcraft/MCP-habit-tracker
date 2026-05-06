const connectionStatus = document.getElementById("connectionStatus");
const connectionDetail = document.getElementById("connectionDetail");

const habitForm = document.getElementById("habitForm");
const habitCancel = document.getElementById("habitCancel");
const habitList = document.getElementById("habitList");
const habitDate = document.getElementById("habitDate");
const habitCategory = document.getElementById("habitCategory");
const habitRefresh = document.getElementById("habitRefresh");
const foodMetrics = document.getElementById("foodMetrics");
const fitnessMetrics = document.getElementById("fitnessMetrics");
const sleepMetrics = document.getElementById("sleepMetrics");
const studyMetrics = document.getElementById("studyMetrics");
const exerciseList = document.getElementById("exerciseList");
const classList = document.getElementById("classList");
const addExercise = document.getElementById("addExercise");
const addClass = document.getElementById("addClass");

const eventForm = document.getElementById("eventForm");
const eventCancel = document.getElementById("eventCancel");
const eventList = document.getElementById("eventList");
const eventStart = document.getElementById("eventStart");
const eventEnd = document.getElementById("eventEnd");
const eventRefresh = document.getElementById("eventRefresh");
const qaForm = document.getElementById("qaForm");
const qaInput = document.getElementById("qaInput");
const qaAnswer = document.getElementById("qaAnswer");

const tabs = Array.from(document.querySelectorAll(".tab"));
const panels = Array.from(document.querySelectorAll(".panel"));

const today = new Date();
const toDateInput = (value) => value.toISOString().slice(0, 10);

habitDate.value = toDateInput(today);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 6);

eventStart.value = toDateInput(today);
eventEnd.value = toDateInput(nextWeek);

let habitEditingId = null;
let eventEditingId = null;

const mcpClient = window.mcpClient || window.mcp;
const bridgeStatus = {
  mode: "unknown",
  detail: "",
};

const metricGroups = {
  food: foodMetrics,
  fitness: fitnessMetrics,
  sleep: sleepMetrics,
  studying: studyMetrics,
};

const setConnectionStatus = (connected, detail) => {
  connectionStatus.classList.toggle("connected", connected);
  connectionDetail.textContent = detail;
};

const callTool = async (tool, args) => {
  if (mcpClient && typeof mcpClient.callTool === "function") {
    setConnectionStatus(true, "Connected via MCP host");
    const result = await mcpClient.callTool({ name: tool, arguments: args });
    const payload = result?.content?.[0]?.text;
    if (!payload) {
      return {};
    }
    return JSON.parse(payload);
  }

  return callLocalBridge(tool, args);
};

const callLocalBridge = async (tool, args) => {
  const map = {
    "habits.list": {
      method: "GET",
      path: "/api/habits",
      query: ["date", "category"],
    },
    "habits.create": { method: "POST", path: "/api/habits" },
    "habits.update": { method: "PUT", path: "/api/habits/:id" },
    "habits.delete": { method: "DELETE", path: "/api/habits/:id" },
    "events.list": {
      method: "GET",
      path: "/api/events",
      query: ["startDate", "endDate"],
    },
    "events.create": { method: "POST", path: "/api/events" },
    "events.update": { method: "PUT", path: "/api/events/:id" },
    "events.delete": { method: "DELETE", path: "/api/events/:id" },
    "qa.ask": { method: "POST", path: "/api/qa" },
  };

  const config = map[tool];
  if (!config) {
    throw new Error(`Unsupported tool: ${tool}`);
  }

  let url = config.path;
  if (url.includes(":id")) {
    url = url.replace(":id", encodeURIComponent(args.id));
  }

  if (config.query) {
    const params = new URLSearchParams();
    config.query.forEach((key) => {
      if (args[key]) {
        params.set(key, args[key]);
      }
    });
    const query = params.toString();
    if (query) {
      url += `?${query}`;
    }
  }

  const options = { method: config.method };
  if (config.method !== "GET" && config.method !== "DELETE") {
    const payload = { ...args };
    delete payload.id;
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(payload);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Bridge request failed.");
    }
    setConnectionStatus(true, "Connected via local bridge");
    bridgeStatus.mode = "bridge";
    bridgeStatus.detail = "Connected";
    return data;
  } catch (error) {
    setConnectionStatus(false, "Local bridge unavailable");
    bridgeStatus.mode = "error";
    bridgeStatus.detail = error.message;
    throw error;
  }
};

const parseNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const stripEmpty = (obj) => {
  const cleaned = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== null && value !== "" && value !== undefined) {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

const clearMetricLists = () => {
  exerciseList.innerHTML = "";
  classList.innerHTML = "";
};

const buildExerciseRow = (exercise = {}) => {
  const row = document.createElement("div");
  row.className = "metric-row";

  const nameLabel = document.createElement("label");
  nameLabel.textContent = "Exercise";
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "exercise-name";
  nameInput.placeholder = "Bench press";
  nameInput.value = exercise.name || "";
  nameLabel.appendChild(nameInput);

  const weightLabel = document.createElement("label");
  weightLabel.textContent = "Weight";
  const weightInput = document.createElement("input");
  weightInput.type = "number";
  weightInput.min = "0";
  weightInput.step = "1";
  weightInput.className = "exercise-weight";
  weightInput.placeholder = "135";
  weightInput.value = exercise.weight ?? "";
  weightLabel.appendChild(weightInput);

  const repsLabel = document.createElement("label");
  repsLabel.textContent = "Reps";
  const repsInput = document.createElement("input");
  repsInput.type = "number";
  repsInput.min = "0";
  repsInput.step = "1";
  repsInput.className = "exercise-reps";
  repsInput.placeholder = "8";
  repsInput.value = exercise.reps ?? "";
  repsLabel.appendChild(repsInput);

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "ghost small remove";
  removeButton.textContent = "Remove";
  removeButton.addEventListener("click", () => {
    row.remove();
  });

  row.append(nameLabel, weightLabel, repsLabel, removeButton);
  return row;
};

const buildClassRow = (entry = {}) => {
  const row = document.createElement("div");
  row.className = "metric-row";

  const nameLabel = document.createElement("label");
  nameLabel.textContent = "Class";
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "class-name";
  nameInput.placeholder = "Calculus";
  nameInput.value = entry.name || "";
  nameLabel.appendChild(nameInput);

  const startLabel = document.createElement("label");
  startLabel.textContent = "Start time";
  const startInput = document.createElement("input");
  startInput.type = "time";
  startInput.className = "class-start";
  startInput.value = entry.startTime || "";
  startLabel.appendChild(startInput);

  const endLabel = document.createElement("label");
  endLabel.textContent = "End time";
  const endInput = document.createElement("input");
  endInput.type = "time";
  endInput.className = "class-end";
  endInput.value = entry.endTime || "";
  endLabel.appendChild(endInput);

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "ghost small remove";
  removeButton.textContent = "Remove";
  removeButton.addEventListener("click", () => {
    row.remove();
  });

  row.append(nameLabel, startLabel, endLabel, removeButton);
  return row;
};

const ensureMetricRows = (category) => {
  if (category === "fitness" && exerciseList.children.length === 0) {
    exerciseList.appendChild(buildExerciseRow());
  }
  if (category === "studying" && classList.children.length === 0) {
    classList.appendChild(buildClassRow());
  }
};

const setMetricVisibility = (category) => {
  Object.entries(metricGroups).forEach(([key, group]) => {
    group.classList.toggle("active", key === category);
  });
  ensureMetricRows(category);
};

const readMetrics = () => {
  const category = habitForm.category.value;

  if (category === "food") {
    const metrics = stripEmpty({
      calories: parseNumber(habitForm.calories.value),
      protein: parseNumber(habitForm.protein.value),
      fat: parseNumber(habitForm.fat.value),
      carbs: parseNumber(habitForm.carbs.value),
    });
    return metrics;
  }

  if (category === "sleep") {
    const metrics = stripEmpty({
      startTime: habitForm.sleepStart.value,
      endTime: habitForm.sleepEnd.value,
    });
    return metrics;
  }

  if (category === "fitness") {
    const exercises = Array.from(exerciseList.querySelectorAll(".metric-row"))
      .map((row) => {
        const name = row.querySelector(".exercise-name").value.trim();
        const weight = parseNumber(row.querySelector(".exercise-weight").value);
        const reps = parseNumber(row.querySelector(".exercise-reps").value);
        if (!name) {
          return null;
        }
        return stripEmpty({ name, weight, reps });
      })
      .filter(Boolean);

    return exercises.length ? { exercises } : {};
  }

  if (category === "studying") {
    const classes = Array.from(classList.querySelectorAll(".metric-row"))
      .map((row) => {
        const name = row.querySelector(".class-name").value.trim();
        const startTime = row.querySelector(".class-start").value;
        const endTime = row.querySelector(".class-end").value;
        if (!name) {
          return null;
        }
        return stripEmpty({ name, startTime, endTime });
      })
      .filter(Boolean);

    return classes.length ? { classes } : {};
  }

  return {};
};

const applyMetrics = (category, metrics = {}) => {
  clearMetricLists();
  setMetricVisibility(category);

  if (category === "food") {
    habitForm.calories.value = metrics.calories ?? "";
    habitForm.protein.value = metrics.protein ?? "";
    habitForm.fat.value = metrics.fat ?? "";
    habitForm.carbs.value = metrics.carbs ?? "";
  }

  if (category === "sleep") {
    habitForm.sleepStart.value = metrics.startTime ?? "";
    habitForm.sleepEnd.value = metrics.endTime ?? "";
  }

  if (category === "fitness") {
    const exercises = Array.isArray(metrics.exercises) ? metrics.exercises : [];
    if (exercises.length === 0) {
      ensureMetricRows("fitness");
      return;
    }
    exercises.forEach((exercise) => {
      exerciseList.appendChild(buildExerciseRow(exercise));
    });
  }

  if (category === "studying") {
    const classes = Array.isArray(metrics.classes) ? metrics.classes : [];
    if (classes.length === 0) {
      ensureMetricRows("studying");
      return;
    }
    classes.forEach((entry) => {
      classList.appendChild(buildClassRow(entry));
    });
  }
};

const formatHabitMetrics = (habit) => {
  const metrics = habit.metrics || {};
  if (habit.category === "food") {
    const parts = [];
    if (metrics.calories !== undefined) {
      parts.push(`${metrics.calories} cal`);
    }
    if (metrics.protein !== undefined) {
      parts.push(`${metrics.protein}g protein`);
    }
    if (metrics.fat !== undefined) {
      parts.push(`${metrics.fat}g fat`);
    }
    if (metrics.carbs !== undefined) {
      parts.push(`${metrics.carbs}g carbs`);
    }
    return parts.join(" | ");
  }

  if (habit.category === "sleep") {
    if (metrics.startTime || metrics.endTime) {
      return `${metrics.startTime || ""} - ${metrics.endTime || ""}`.trim();
    }
  }

  if (habit.category === "fitness" && Array.isArray(metrics.exercises)) {
    return metrics.exercises
      .map((exercise) => {
        if (!exercise) {
          return "";
        }
        const details = [];
        if (exercise.weight !== undefined) {
          details.push(`${exercise.weight} lb`);
        }
        if (exercise.reps !== undefined) {
          details.push(`${exercise.reps} reps`);
        }
        return details.length
          ? `${exercise.name} (${details.join(", ")})`
          : exercise.name;
      })
      .filter(Boolean)
      .join(" | ");
  }

  if (habit.category === "studying" && Array.isArray(metrics.classes)) {
    return metrics.classes
      .map((entry) => {
        if (!entry) {
          return "";
        }
        const window = [entry.startTime, entry.endTime].filter(Boolean).join("-");
        return window ? `${entry.name} (${window})` : entry.name;
      })
      .filter(Boolean)
      .join(" | ");
  }

  return "";
};

const renderHabitList = (habits) => {
  habitList.innerHTML = "";
  if (!habits.length) {
    habitList.innerHTML = '<li class="notice">No habits found.</li>';
    return;
  }

  habits.forEach((habit) => {
    const item = document.createElement("li");
    item.className = "list-item";

    const title = document.createElement("h3");
    title.textContent = `${habit.category} on ${habit.date}`;

    const meta = document.createElement("div");
    meta.className = "meta";
    const metricsSummary = formatHabitMetrics(habit);
    if (habit.notes && metricsSummary) {
      meta.textContent = `${habit.notes} | ${metricsSummary}`;
    } else {
      meta.textContent = habit.notes || metricsSummary || "No notes";
    }

    const actions = document.createElement("div");
    actions.className = "list-actions";

    const editButton = document.createElement("button");
    editButton.className = "ghost";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => startHabitEdit(habit));

    const deleteButton = document.createElement("button");
    deleteButton.className = "ghost";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteHabit(habit.id));

    actions.append(editButton, deleteButton);

    item.append(title, meta, actions);
    habitList.appendChild(item);
  });
};

const renderEventList = (events) => {
  eventList.innerHTML = "";
  if (!events.length) {
    eventList.innerHTML = '<li class="notice">No events found.</li>';
    return;
  }

  events.forEach((event) => {
    const item = document.createElement("li");
    item.className = "list-item";

    const title = document.createElement("h3");
    title.textContent = `${event.title}`;

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${event.date} | ${event.startTime} - ${event.endTime}`;

    const actions = document.createElement("div");
    actions.className = "list-actions";

    const editButton = document.createElement("button");
    editButton.className = "ghost";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => startEventEdit(event));

    const deleteButton = document.createElement("button");
    deleteButton.className = "ghost";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteEvent(event.id));

    actions.append(editButton, deleteButton);

    item.append(title, meta, actions);
    eventList.appendChild(item);
  });
};

const loadHabits = async () => {
  const date = habitDate.value || undefined;
  const category = habitCategory.value || undefined;

  try {
    const result = await callTool("habits.list", { date, category });
    if (result.error) {
      throw new Error(result.error);
    }
    renderHabitList(result.habits || []);
  } catch (error) {
    habitList.innerHTML = `<li class="notice">${error.message}</li>`;
  }
};

const loadEvents = async () => {
  const startDate = eventStart.value || undefined;
  const endDate = eventEnd.value || undefined;

  try {
    const result = await callTool("events.list", { startDate, endDate });
    if (result.error) {
      throw new Error(result.error);
    }
    renderEventList(result.events || []);
  } catch (error) {
    eventList.innerHTML = `<li class="notice">${error.message}</li>`;
  }
};

const resetHabitForm = () => {
  habitEditingId = null;
  habitForm.reset();
  habitForm.category.value = habitCategory.value || "food";
  habitForm.date.value = habitDate.value;
  habitForm.id.value = "";
  habitCancel.hidden = true;
  clearMetricLists();
  applyMetrics(habitForm.category.value, {});
};

const resetEventForm = () => {
  eventEditingId = null;
  eventForm.reset();
  eventForm.date.value = eventStart.value;
  eventForm.id.value = "";
  eventCancel.hidden = true;
};

const startHabitEdit = (habit) => {
  habitEditingId = habit.id;
  habitForm.category.value = habit.category;
  habitForm.date.value = habit.date;
  habitForm.notes.value = habit.notes || "";
  habitForm.id.value = habit.id;
  habitCancel.hidden = false;
  applyMetrics(habit.category, habit.metrics || {});
};

const startEventEdit = (event) => {
  eventEditingId = event.id;
  eventForm.title.value = event.title;
  eventForm.date.value = event.date;
  eventForm.startTime.value = event.startTime;
  eventForm.endTime.value = event.endTime;
  eventForm.notes.value = event.notes || "";
  eventForm.id.value = event.id;
  eventCancel.hidden = false;
};

const deleteHabit = async (id) => {
  try {
    const result = await callTool("habits.delete", { id });
    if (result.error) {
      throw new Error(result.error);
    }
    await loadHabits();
  } catch (error) {
    alert(error.message);
  }
};

const deleteEvent = async (id) => {
  try {
    const result = await callTool("events.delete", { id });
    if (result.error) {
      throw new Error(result.error);
    }
    await loadEvents();
  } catch (error) {
    alert(error.message);
  }
};

habitForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    category: habitForm.category.value,
    date: habitForm.date.value,
    notes: habitForm.notes.value.trim(),
    metrics: readMetrics(),
  };

  try {
    const tool = habitEditingId ? "habits.update" : "habits.create";
    if (habitEditingId) {
      payload.id = habitEditingId;
    }

    const result = await callTool(tool, payload);
    if (result.error) {
      throw new Error(result.error);
    }

    resetHabitForm();
    await loadHabits();
  } catch (error) {
    alert(error.message);
  }
});

habitCancel.addEventListener("click", () => {
  resetHabitForm();
});

addExercise.addEventListener("click", () => {
  exerciseList.appendChild(buildExerciseRow());
});

addClass.addEventListener("click", () => {
  classList.appendChild(buildClassRow());
});

habitRefresh.addEventListener("click", () => {
  loadHabits();
});

habitDate.addEventListener("change", () => {
  habitForm.date.value = habitDate.value;
  loadHabits();
});

habitCategory.addEventListener("change", () => {
  habitForm.category.value = habitCategory.value || "food";
  loadHabits();
});

habitForm.category.addEventListener("change", () => {
  clearMetricLists();
  applyMetrics(habitForm.category.value, {});
});

qaForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = qaInput.value.trim();
  if (!question) {
    return;
  }

  qaAnswer.textContent = "Thinking...";
  try {
    const result = await callTool("qa.ask", { question });
    qaAnswer.textContent = result.answer || "No response.";
  } catch (error) {
    qaAnswer.textContent = error.message || "Unable to answer that question.";
  }
});

eventForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    title: eventForm.title.value.trim(),
    date: eventForm.date.value,
    startTime: eventForm.startTime.value,
    endTime: eventForm.endTime.value,
    notes: eventForm.notes.value.trim(),
  };

  try {
    const tool = eventEditingId ? "events.update" : "events.create";
    if (eventEditingId) {
      payload.id = eventEditingId;
    }

    const result = await callTool(tool, payload);
    if (result.error) {
      throw new Error(result.error);
    }

    resetEventForm();
    await loadEvents();
  } catch (error) {
    alert(error.message);
  }
});

eventCancel.addEventListener("click", () => {
  resetEventForm();
});

eventRefresh.addEventListener("click", () => {
  loadEvents();
});

[eventStart, eventEnd].forEach((input) => {
  input.addEventListener("change", () => {
    loadEvents();
  });
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.remove("active"));
    panels.forEach((panel) => panel.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

const initialize = () => {
  if (!mcpClient || typeof mcpClient.callTool !== "function") {
    setConnectionStatus(false, "Waiting for MCP host or local bridge...");
  } else {
    setConnectionStatus(true, "Connected via MCP host");
  }

  habitForm.date.value = habitDate.value;
  eventForm.date.value = eventStart.value;
  applyMetrics(habitForm.category.value, {});

  loadHabits();
  loadEvents();
};

initialize();
