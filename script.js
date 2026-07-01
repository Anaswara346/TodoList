
// ===============================
// DOM Elements
// ===============================
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const prioritySelect = document.getElementById("prioritySelect");
const categorySelect = document.getElementById("categorySelect");
const dueDateInput = document.getElementById("dueDateInput");
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

function loadState() {
  const storedTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.tasks) || "[]");
  const storedTheme = localStorage.getItem(STORAGE_KEYS.theme) || "light";
  const storedSort = localStorage.getItem(STORAGE_KEYS.sort) || "newest";
  const storedFilter = localStorage.getItem(STORAGE_KEYS.filter) || "all";

  state.tasks = Array.isArray(storedTasks) ? storedTasks : [];
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

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function isOverdue(task) {
  if (!task.dueDate || task.completed) return false;
  return task.dueDate < getTodayString();
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
  const badgeText = task.priority ? getPriorityLabel(task.priority) : "Medium";
  const categoryText = task.category ? getCategoryLabel(task.category) : "Other";

  return `
    <li class="task-card ${completedClass} ${overdueClass}" data-task-id="${task.id}" draggable="true">
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
          </div>
          <div class="task-meta">
            <span>Due: ${escapeHtml(task.dueDate ? formatDate(task.dueDate) : "No due date")}</span>
            <span>Created: ${escapeHtml(formatCreatedAt(task.createdAt))}</span>
          </div>
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

  const payload = {
    title,
    priority: prioritySelect.value,
    category: categorySelect.value,
    dueDate: dueDateInput.value
  };

  if (state.editingId) {
    state.tasks = state.tasks.map((task) =>
      task.id === state.editingId ? { ...task, ...payload } : task
    );
    saveTasks();
    showToast("Task updated.", "success");
  } else {
    state.tasks.unshift({
      id: Date.now(),
      title,
      completed: false,
      priority: payload.priority,
      category: payload.category,
      dueDate: payload.dueDate,
      createdAt: new Date().toISOString(),
      order: state.tasks.length
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

function toggleTask(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;

  task.completed = !task.completed;
  saveTasks();
  renderTasks();
  showToast(task.completed ? "Task completed." : "Task marked active.", "success");
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
    if (event.target.matches('input[type="checkbox"]')) {
      const taskId = Number(event.target.closest(".task-card").dataset.taskId);
      toggleTask(taskId);
    }
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
