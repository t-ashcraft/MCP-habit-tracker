const connectionStatus = document.getElementById("connectionStatus");
const connectionDetail = document.getElementById("connectionDetail");

const habitForm = document.getElementById("habitForm");
const habitCancel = document.getElementById("habitCancel");
const habitList = document.getElementById("habitList");
const habitDate = document.getElementById("habitDate");
const habitCategory = document.getElementById("habitCategory");
const habitRefresh = document.getElementById("habitRefresh");

const eventForm = document.getElementById("eventForm");
const eventCancel = document.getElementById("eventCancel");
const eventList = document.getElementById("eventList");
const eventStart = document.getElementById("eventStart");
const eventEnd = document.getElementById("eventEnd");
const eventRefresh = document.getElementById("eventRefresh");

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

const setConnectionStatus = (connected, detail) => {
  connectionStatus.classList.toggle("connected", connected);
  connectionDetail.textContent = detail;
};

const callTool = async (tool, args) => {
  if (!mcpClient || typeof mcpClient.callTool !== "function") {
    setConnectionStatus(false, "No MCP client detected.");
    throw new Error("No MCP client detected in browser.");
  }

  setConnectionStatus(true, "Connected");
  const result = await mcpClient.callTool({ name: tool, arguments: args });
  const payload = result?.content?.[0]?.text;
  if (!payload) {
    return {};
  }
  return JSON.parse(payload);
};

const safeJsonParse = (value) => {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error("Metrics must be valid JSON.");
  }
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
    meta.textContent = habit.notes || "No notes";

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
  habitForm.metrics.value = habit.metrics ? JSON.stringify(habit.metrics) : "";
  habitForm.id.value = habit.id;
  habitCancel.hidden = false;
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
    metrics: safeJsonParse(habitForm.metrics.value.trim()),
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
    setConnectionStatus(false, "Waiting for MCP client.");
  } else {
    setConnectionStatus(true, "Connected");
  }

  habitForm.date.value = habitDate.value;
  eventForm.date.value = eventStart.value;

  loadHabits();
  loadEvents();
};

initialize();
