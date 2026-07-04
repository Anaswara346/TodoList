
// ===============================
// DOM Elements
// ===============================
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const descriptionInput = document.getElementById("descriptionInput");
const prioritySelect = document.getElementById("prioritySelect");
const categorySelect = document.getElementById("categorySelect");
const dueDateInput = document.getElementById("dueDateInput");
const progressInput = document.getElementById("progressInput") || { value: "0" };
const statusSelect = document.getElementById("statusSelect");
const addBtn = document.getElementById("addBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.getElementById("filterButtons");
const sortSelect = document.getElementById("sortSelect");
const clearCompletedBtn = document.getElementById("clearCompleted");
const themeBtn = document.getElementById("themeBtn");
const totalTasksEl = document.getElementById("totalTasks");
const activeTasksEl = document.getElementById("activeTasks");
const completedTasksEl = document.getElementById("completedTasks");
const overdueTasksEl = document.getElementById("overdueTasks");
const progressFill = document.getElementById("progressFill");
const completionPill = document.getElementById("completionPill");
const upcomingList = document.getElementById("upcomingList");
const toastEl = document.getElementById("toast");

// ===============================
// State
// ===============================
const STORAGE_KEYS = {
  tasks: "flow-planner.tasks",
  theme: "flow-planner.theme",
  sort: "flow-planner.sort",
  filter: "flow-planner.filter"
};

const state = {
  tasks: [],
  filter: "all",
  sort: "newest",
  search: "",
  editingId: null,
  theme: "light",
  draggedTaskId: null
};

// ===============================
// Local Storage
// ===============================
function saveTasks() {
  localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(state.tasks));
}

function savePreferences() {
  localStorage.setItem(STORAGE_KEYS.theme, state.theme);
  localStorage.setItem(STORAGE_KEYS.sort, state.sort);
  localStorage.setItem(STORAGE_KEYS.filter, state.filter);
}

function normalizeTask(task) {
  const completed = Boolean(task.completed);
  return {
    ...task,
    description: task.description || "",
    progress: Number(task.progress ?? (completed ? 100 : 0)),
    status: task.status || (completed ? "completed" : "planned"),
    subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
    createdAt: task.createdAt || new Date().toISOString()
  };
}

function loadState() {
  const storedTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.tasks) || "[]");
  const storedTheme = localStorage.getItem(STORAGE_KEYS.theme) || "light";
  const storedSort = localStorage.getItem(STORAGE_KEYS.sort) || "newest";
  const storedFilter = localStorage.getItem(STORAGE_KEYS.filter) || "all";

  state.tasks = Array.isArray(storedTasks) ? storedTasks.map(normalizeTask) : [];
  state.theme = storedTheme;
  state.sort = storedSort;
  state.filter = storedFilter;
}

// ===============================
// Utilities
// ===============================
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatCreatedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}

function formatTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function isOverdue(task) {
  if (!task.dueDate || task.completed) return false;
  return task.dueDate < getTodayString();
}

function getDeadlineState(task) {
  if (!task.dueDate || task.completed) return null;
  const today = new Date(getTodayString());
  const dueDate = new Date(task.dueDate);
  const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: "Overdue", className: "deadline-overdue" };
  }

  if (diffDays <= 2) {
    return { label: "Due soon", className: "deadline-soon" };
  }

  return null;
}

function getPriorityValue(priority) {
  switch (priority) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
    default:
      return 1;
  }
}

function getStatusLabel(status) {
  switch (status) {
    case "in-progress":
      return "In progress";
    case "blocked":
      return "Blocked";
    case "review":
      return "Review";
    case "completed":
      return "Completed";
    case "planned":
    default:
      return "Planned";
  }
}

function getStatusClass(status) {
  switch (status) {
    case "in-progress":
      return "status-in-progress";
    case "blocked":
      return "status-blocked";
    case "review":
      return "status-review";
    case "completed":
      return "status-completed";
    case "planned":
    default:
      return "status-planned";
  }
}

function getPriorityLabel(priority) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function getCategoryLabel(category) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function getPriorityClass(priority) {
  return `priority-${priority}`;
}

function buildTaskMarkup(task) {
  const completedClass = task.completed ? "completed" : "";
  const overdueClass = isOverdue(task) ? "overdue" : "";
  const deadlineState = getDeadlineState(task);
  const warningClass = deadlineState ? deadlineState.className : "";
  const badgeText = task.priority ? getPriorityLabel(task.priority) : "Medium";
  const categoryText = task.category ? getCategoryLabel(task.category) : "Other";
  const progressValue = Math.max(0, Math.min(100, Number(task.progress) || 0));
  const statusText = getStatusLabel(task.status);
  const statusClass = getStatusClass(task.status);
  const descriptionMarkup = task.description
    ? `<p class="task-description">${escapeHtml(task.description)}</p>`
    : "";
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  const subtasksMarkup = subtasks.length
    ? `
        <div class="task-subtasks">
          <strong>Subtasks</strong>
          <ul>
            ${subtasks
              .map(
                (subtask) => `
                  <li class="subtask-item ${subtask.completed ? "done" : ""}" data-subtask-id="${subtask.id}">
                    <div class="subtask-content">
                      <label>
                        <input type="checkbox" ${subtask.completed ? "checked" : ""} />
                        <span>${escapeHtml(subtask.title)}</span>
                      </label>
                      <span class="subtask-time">${subtask.createdAt ? escapeHtml(formatTimestamp(subtask.createdAt)) : ""}</span>
                    </div>
                    <button class="subtask-delete" type="button" aria-label="Remove subtask">×</button>
                  </li>
                `
              )
              .join("")}
          </ul>
        </div>
      `
    : "";
  return `
    <li class="task-card ${completedClass} ${overdueClass} ${warningClass}" data-task-id="${task.id}" draggable="true">
      <div class="task-main">
        <label class="task-check" aria-label="Mark task as complete">
          <input type="checkbox" ${task.completed ? "checked" : ""} />
        </label>
        <div class="task-body">
          <div class="task-title-row">
            <h3 class="task-title">${escapeHtml(task.title)}</h3>
            <div class="task-actions">
              <button class="task-action" type="button" data-action="edit" aria-label="Edit task">✏️</button>
              <button class="task-action delete" type="button" data-action="delete" aria-label="Delete task">🗑️</button>
            </div>
          </div>
          <div class="task-badges">
            <span class="badge priority-${task.priority || "medium"} ${getPriorityClass(task.priority || "medium")}">${badgeText}</span>
            <span class="badge category">${escapeHtml(categoryText)}</span>
            <span class="badge status ${statusClass}">${escapeHtml(statusText)}</span>
            ${deadlineState ? `<span class="badge deadline ${deadlineState.className}">${escapeHtml(deadlineState.label)}</span>` : ""}
          </div>
          ${descriptionMarkup}
          <div class="task-progress">
            <div class="task-progress-row">
              <span>Progress</span>
              <strong>${progressValue}%</strong>
            </div>
            <div class="mini-progress-bar" aria-hidden="true">
              <span style="width: ${progressValue}%"></span>
            </div>
          </div>
          <div class="task-meta">
            <span>Due: ${escapeHtml(task.dueDate ? formatDate(task.dueDate) : "No due date")}</span>
            <span>Created: ${escapeHtml(formatCreatedAt(task.createdAt))}</span>
          </div>
          ${subtasksMarkup}
          <form class="subtask-form" data-task-id="${task.id}">
            <input type="text" name="subtask" placeholder="Add a subtask..." maxlength="80" />
            <button type="submit">Add</button>
          </form>
        </div>
      </div>
    </li>
  `;
}

// ===============================
// Rendering
// ===============================
function getFilteredTasks() {
  const searchTerm = state.search.trim().toLowerCase();
  let filtered = [...state.tasks];

  if (searchTerm) {
    filtered = filtered.filter((task) => {
      const haystack = `${task.title} ${task.category}`.toLowerCase();
      return haystack.includes(searchTerm);
    });
  }

  if (state.filter === "active") {
    filtered = filtered.filter((task) => !task.completed);
  } else if (state.filter === "completed") {
    filtered = filtered.filter((task) => task.completed);
  } else if (state.filter === "high-priority") {
    filtered = filtered.filter((task) => task.priority === "high");
  } else if (state.filter === "due-today") {
    filtered = filtered.filter((task) => task.dueDate === getTodayString() && !task.completed);
  } else if (state.filter === "overdue") {
    filtered = filtered.filter((task) => isOverdue(task));
  }

  filtered.sort((a, b) => {
    switch (state.sort) {
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "dueDate": {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      case "priority":
        return getPriorityValue(b.priority) - getPriorityValue(a.priority);
      case "alphabetical":
        return a.title.localeCompare(b.title);
      case "newest":
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  return filtered;
}

function renderTasks() {
  const filteredTasks = getFilteredTasks();
  taskList.innerHTML = filteredTasks.map((task) => buildTaskMarkup(task)).join("");
  emptyState.classList.toggle("active", state.tasks.length === 0);
  updateFilterButtons();
  renderStatistics();
  renderUpcomingList();
}

function renderUpcomingList() {
  const upcomingTasks = state.tasks
    .filter((task) => !task.completed && task.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  if (!upcomingTasks.length) {
    upcomingList.innerHTML = '<li class="upcoming-empty">No upcoming deadlines right now.</li>';
    return;
  }

  upcomingList.innerHTML = upcomingTasks
    .map((task) => {
      const deadlineState = getDeadlineState(task);
      return `
        <li class="upcoming-item ${deadlineState ? deadlineState.className : ""}">
          <strong>${escapeHtml(task.title)}</strong>
          <span>${escapeHtml(formatDate(task.dueDate))}</span>
          ${deadlineState ? `<em>${escapeHtml(deadlineState.label)}</em>` : ""}
        </li>
      `;
    })
    .join("");
}

function updateFilterButtons() {
  document.querySelectorAll(".filter-pill").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === state.filter);
  });
  sortSelect.value = state.sort;
}

function renderStatistics() {
  const total = state.tasks.length;
  const completed = state.tasks.filter((task) => task.completed).length;
  const active = total - completed;
  const overdue = state.tasks.filter((task) => isOverdue(task)).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  totalTasksEl.textContent = total;
  activeTasksEl.textContent = active;
  completedTasksEl.textContent = completed;
  overdueTasksEl.textContent = overdue;
  progressFill.style.width = `${percent}%`;
  completionPill.textContent = `${percent}% done`;
}

// ===============================
// CRUD Functions
// ===============================
function resetForm() {
  taskForm.reset();
  prioritySelect.value = "medium";
  categorySelect.value = "personal";
  dueDateInput.value = "";
  descriptionInput.value = "";
  statusSelect.value = "in-progress";
  state.editingId = null;
  addBtn.textContent = "Add Task";
  cancelEditBtn.classList.add("hidden");
  taskInput.focus();
}

function saveTask() {
  const title = taskInput.value.trim();
  if (!title) {
    showToast("Please enter a task title.", "warning");
    taskInput.focus();
    return;
  }

  const status = statusSelect.value;
  const payload = {
    title,
    description: descriptionInput.value.trim(),
    priority: prioritySelect.value,
    category: categorySelect.value,
    dueDate: dueDateInput.value,
    progress: 0,
    status
  };

  if (state.editingId) {
    state.tasks = state.tasks.map((task) =>
      task.id === state.editingId
        ? {
            ...task,
            ...payload,
            completed: payload.status === "completed" ? true : task.completed
          }
        : task
    );
    saveTasks();
    showToast("Task updated.", "success");
  } else {
    const taskId = Date.now();
    state.tasks.unshift({
      id: taskId,
      title,
      completed: false,
      priority: payload.priority,
      category: payload.category,
      dueDate: payload.dueDate,
      progress: payload.progress,
      status,
      createdAt: new Date().toISOString(),
      order: state.tasks.length,
      subtasks: []
    });
    saveTasks();
    showToast("Task added.", "success");
  }

  renderTasks();
  resetForm();
}

function startEditing(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;

  state.editingId = taskId;
  taskInput.value = task.title;
  prioritySelect.value = task.priority || "medium";
  categorySelect.value = task.category || "personal";
  dueDateInput.value = task.dueDate || "";
  descriptionInput.value = task.description || "";
  statusSelect.value = task.status || (task.completed ? "completed" : "in-progress");
  addBtn.textContent = "Save Task";
  cancelEditBtn.classList.remove("hidden");
  taskInput.focus();
}

function cancelEditing() {
  if (!state.editingId) return;
  resetForm();
  showToast("Editing cancelled.", "warning");
}

function deleteTask(taskId) {
  state.tasks = state.tasks.filter((task) => task.id !== taskId);
  if (state.editingId === taskId) {
    resetForm();
  }
  saveTasks();
  renderTasks();
  showToast("Task deleted.", "success");
}

function updateTaskStatus(taskId, newStatus) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;

  task.status = newStatus;
  task.completed = newStatus === "completed" ? true : false;
  saveTasks();
  renderTasks();
  showToast(`Status updated to ${getStatusLabel(newStatus)}.`, "success");
}

function calculateProgressFromSubtasks(task) {
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  if (subtasks.length === 0) return task.progress || 0;
  const completed = subtasks.filter((s) => s.completed).length;
  return Math.round((completed / subtasks.length) * 100);
}

function toggleTask(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;

  const nextCompleted = !task.completed;
  const nextStatus = nextCompleted ? "completed" : "in-progress";

  task.completed = nextCompleted;
  task.status = nextStatus;
  task.progress = calculateProgressFromSubtasks(task);

  saveTasks();
  renderTasks();
  showToast(nextCompleted ? "Task completed." : "Task marked active.", "success");
}

function clearCompletedTasks() {
  const completedCount = state.tasks.filter((task) => task.completed).length;
  if (!completedCount) {
    showToast("No completed tasks to clear.", "warning");
    return;
  }

  state.tasks = state.tasks.filter((task) => !task.completed);
  saveTasks();
  renderTasks();
  showToast("Completed tasks cleared.", "success");
}

function addSubtask(taskId, subtaskTitle) {
  const task = state.tasks.find((item) => item.id === taskId);
  const title = subtaskTitle.trim();
  if (!task || !title) return;

  task.subtasks = [
    ...(Array.isArray(task.subtasks) ? task.subtasks : []),
    { id: Date.now(), title, completed: false, createdAt: new Date().toISOString() }
  ];

  saveTasks();
  renderTasks();
  showToast("Subtask added.", "success");
}

function toggleSubtask(taskId, subtaskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;

  task.subtasks = (Array.isArray(task.subtasks) ? task.subtasks : []).map((subtask) =>
    subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
  );

  task.progress = calculateProgressFromSubtasks(task);

  saveTasks();
  renderTasks();
}

function removeSubtask(taskId, subtaskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;

  task.subtasks = (Array.isArray(task.subtasks) ? task.subtasks : []).filter((subtask) => subtask.id !== subtaskId);
  saveTasks();
  renderTasks();
}

// ===============================
// Search
// ===============================
function handleSearchInput(event) {
  state.search = event.target.value;
  renderTasks();
}

// ===============================
// Filters
// ===============================
function handleFilterClick(event) {
  const button = event.target.closest(".filter-pill");
  if (!button) return;

  state.filter = button.dataset.filter;
  savePreferences();
  renderTasks();
}

// ===============================
// Sorting
// ===============================
function handleSortChange(event) {
  state.sort = event.target.value;
  savePreferences();
  renderTasks();
}

// ===============================
// Theme
// ===============================
function applyTheme() {
  document.body.classList.toggle("dark", state.theme === "dark");
  themeBtn.textContent = state.theme === "dark" ? "☀️" : "🌙";
  themeBtn.setAttribute("aria-label", state.theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  applyTheme();
  savePreferences();
}

// ===============================
// Drag & Drop
// ===============================
function reorderTasks(fromId, toId) {
  const fromIndex = state.tasks.findIndex((task) => task.id === fromId);
  const toIndex = state.tasks.findIndex((task) => task.id === toId);

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

  const [movedTask] = state.tasks.splice(fromIndex, 1);
  state.tasks.splice(toIndex, 0, movedTask);
  state.tasks = state.tasks.map((task, index) => ({ ...task, order: index }));
  saveTasks();
  renderTasks();
  showToast("Task order updated.", "success");
}

function handleDragStart(event) {
  const taskCard = event.target.closest(".task-card");
  if (!taskCard) return;

  state.draggedTaskId = Number(taskCard.dataset.taskId);
  taskCard.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", String(state.draggedTaskId));
}

function handleDragOver(event) {
  const taskCard = event.target.closest(".task-card");
  if (!taskCard) return;
  event.preventDefault();
}

function handleDrop(event) {
  const targetTaskCard = event.target.closest(".task-card");
  if (!targetTaskCard) return;
  event.preventDefault();

  const targetId = Number(targetTaskCard.dataset.taskId);
  const draggedId = state.draggedTaskId;
  if (draggedId && targetId && draggedId !== targetId) {
    reorderTasks(draggedId, targetId);
  }
}

function handleDragEnd(event) {
  const taskCard = event.target.closest(".task-card");
  if (taskCard) {
    taskCard.classList.remove("dragging");
  }
  state.draggedTaskId = null;
}

// ===============================
// Toast Notifications
// ===============================
function showToast(message, type = "success") {
  toastEl.textContent = message;
  toastEl.className = `toast show ${type}`;
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toastEl.className = "toast";
  }, 2200);
}

// ===============================
// Event Listeners
// ===============================
function bindEvents() {
  taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveTask();
  });

  taskInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveTask();
    }
  });

  cancelEditBtn.addEventListener("click", cancelEditing);
  searchInput.addEventListener("input", handleSearchInput);
  filterButtons.addEventListener("click", handleFilterClick);
  sortSelect.addEventListener("change", handleSortChange);
  clearCompletedBtn.addEventListener("click", clearCompletedTasks);
  themeBtn.addEventListener("click", toggleTheme);

  taskList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const taskId = Number(button.closest(".task-card").dataset.taskId);
    const action = button.dataset.action;

    if (action === "edit") {
      startEditing(taskId);
    } else if (action === "delete") {
      deleteTask(taskId);
    }
  });

  taskList.addEventListener("change", (event) => {
    if (event.target.matches('.task-check input[type="checkbox"]')) {
      const taskId = Number(event.target.closest(".task-card").dataset.taskId);
      toggleTask(taskId);
    }

    if (event.target.matches('.subtask-item input[type="checkbox"]')) {
      const subtaskItem = event.target.closest(".subtask-item");
      const taskId = Number(subtaskItem.closest(".task-card").dataset.taskId);
      const subtaskId = Number(subtaskItem.dataset.subtaskId);
      toggleSubtask(taskId, subtaskId);
    }

  });

  taskList.addEventListener("submit", (event) => {
    const form = event.target.closest(".subtask-form");
    if (!form) return;

    event.preventDefault();
    const taskId = Number(form.dataset.taskId);
    const input = form.querySelector('input[name="subtask"]');
    addSubtask(taskId, input.value);
    input.value = "";
  });

  taskList.addEventListener("click", (event) => {
    const deleteButton = event.target.closest(".subtask-delete");
    if (!deleteButton) return;

    const subtaskItem = deleteButton.closest(".subtask-item");
    const taskId = Number(subtaskItem.closest(".task-card").dataset.taskId);
    const subtaskId = Number(subtaskItem.dataset.subtaskId);
    removeSubtask(taskId, subtaskId);
  });

  taskList.addEventListener("dragstart", handleDragStart);
  taskList.addEventListener("dragover", handleDragOver);
  taskList.addEventListener("drop", handleDrop);
  taskList.addEventListener("dragend", handleDragEnd);

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "/") {
      event.preventDefault();
      taskInput.focus();
    }

    if (event.key === "Escape" && state.editingId) {
      event.preventDefault();
      cancelEditing();
    }
  });
}

// ===============================
// Initialization
// ===============================
function init() {
  loadState();
  applyTheme();
  bindEvents();
  renderTasks();
}

document.addEventListener("DOMContentLoaded", init);
