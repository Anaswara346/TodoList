// const taskInput = document.getElementById("taskInput");
// const addBtn = document.getElementById("addBtn");
// const taskList = document.getElementById("taskList");
// const taskCount = document.getElementById("taskCount");

// function updateTaskCount() {

//     const total = document.querySelectorAll(".task").length;

//     taskCount.textContent = `${total} Tasks Left`;

// }

// function addTask(){

//     const text = taskInput.value.trim();

//     if(text===""){

//         alert("Please enter a task.");

//         return;

//     }

//     const li=document.createElement("li");

//     li.className="task";

//     li.innerHTML=`

//         <div class="left">

//             <input type="checkbox">

//             <span>${text}</span>

//         </div>

//         <div class="actions">

//             <button class="edit">✏️</button>

//             <button class="delete">🗑️</button>

//         </div>

//     `;

//     taskList.appendChild(li);

//     taskInput.value="";

//     taskInput.focus();

//     updateTaskCount();

// }

// addBtn.addEventListener("click",addTask);

// taskInput.addEventListener("keypress",function(e){

//     if(e.key==="Enter"){

//         addTask();

//     }

// });

// taskList.addEventListener("click",function(e){

//     const task=e.target.closest(".task");

//     if(!task) return;

//     // Delete Task

//     if(e.target.classList.contains("delete")){

//         task.remove();

//         updateTaskCount();

//     }

//     // Edit Task

//     if(e.target.classList.contains("edit")){

//         const span=task.querySelector("span");

//         const updated=prompt("Edit Task",span.textContent);

//         if(updated!==null && updated.trim()!==""){

//             span.textContent=updated;

//         }

//     }

// });

// taskList.addEventListener("change",function(e){

//     if(e.target.type==="checkbox"){

//         const span=e.target.nextElementSibling;

//         span.classList.toggle("completed");

//     }

// });

// updateTaskCount();

// ===============================
// Todo App - Milestone 3
// Part 1
// ===============================

// DOM Elements
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");
const searchInput = document.getElementById("searchInput");
const clearCompletedBtn = document.getElementById("clearCompleted");

const filterButtons = document.querySelectorAll(".filters button");

let tasks = [];
let currentFilter = "all";

// ===============================
// Local Storage
// ===============================

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
    const savedTasks = JSON.parse(localStorage.getItem("tasks"));

    if (savedTasks) {
        tasks = savedTasks;
    }

    renderTasks();
}

// ===============================
// Task Counter
// ===============================

function updateTaskCount() {

    const activeTasks = tasks.filter(task => !task.completed).length;

    taskCount.textContent = `${activeTasks} Task${activeTasks !== 1 ? "s" : ""} Left`;

}

// ===============================
// Add Task
// ===============================

function addTask() {

    const text = taskInput.value.trim();

    if (text === "") {
        alert("Please enter a task.");
        return;
    }

    tasks.push({

        id: Date.now(),

        text: text,

        completed: false

    });

    saveTasks();

    renderTasks();

    taskInput.value = "";

    taskInput.focus();

}

// ===============================
// Delete Task
// ===============================

function deleteTask(id) {

    tasks = tasks.filter(task => task.id !== id);

    saveTasks();

    renderTasks();

}

// ===============================
// Toggle Complete
// ===============================

function toggleTask(id) {

    tasks = tasks.map(task => {

        if (task.id === id) {

            task.completed = !task.completed;

        }

        return task;

    });

    saveTasks();

    renderTasks();

}

// ===============================
// Edit Task
// ===============================

function editTask(id) {

    const task = tasks.find(task => task.id === id);

    const updated = prompt("Edit Task", task.text);

    if (updated === null) return;

    if (updated.trim() === "") return;

    task.text = updated.trim();

    saveTasks();

    renderTasks();

}

// ===============================
// Clear Completed
// ===============================

function clearCompleted() {

    tasks = tasks.filter(task => !task.completed);

    saveTasks();

    renderTasks();

}

// ===============================
// Render Tasks
// ===============================

function renderTasks() {

    taskList.innerHTML = "";

    let filteredTasks = [...tasks];

    // Search

    const keyword = searchInput.value.toLowerCase();

    if (keyword !== "") {

        filteredTasks = filteredTasks.filter(task =>
            task.text.toLowerCase().includes(keyword)
        );

    }

    // Filter

    if (currentFilter === "active") {

        filteredTasks = filteredTasks.filter(task => !task.completed);

    }

    if (currentFilter === "completed") {

        filteredTasks = filteredTasks.filter(task => task.completed);

    }

    filteredTasks.forEach(task => {

        const li = document.createElement("li");

        li.className = "task";

        li.innerHTML = `
            <div class="left">

                <input
                    type="checkbox"
                    ${task.completed ? "checked" : ""}
                >

                <span class="${task.completed ? "completed" : ""}">
                    ${task.text}
                </span>

            </div>

            <div class="actions">

                <button class="edit">
                    ✏️
                </button>

                <button class="delete">
                    🗑️
                </button>

            </div>
        `;

        // Checkbox
        li.querySelector("input").addEventListener("change", () => {

            toggleTask(task.id);

        });

        // Edit
        li.querySelector(".edit").addEventListener("click", () => {

            editTask(task.id);

        });

        // Delete
        li.querySelector(".delete").addEventListener("click", () => {

            deleteTask(task.id);

        });

        taskList.appendChild(li);

    });

    updateTaskCount();

}

// ===============================
// Event Listeners
// ===============================

// Add Task Button
addBtn.addEventListener("click", addTask);

// Press Enter to Add Task
taskInput.addEventListener("keypress", function (e) {

    if (e.key === "Enter") {

        addTask();

    }

});

// Search Tasks
searchInput.addEventListener("input", function () {

    renderTasks();

});

// Filter Buttons
filterButtons.forEach(button => {

    button.addEventListener("click", function () {

        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove("active"));

        // Add active class to clicked button
        this.classList.add("active");

        const filter = this.textContent.trim().toLowerCase();

        if (filter === "all") {

            currentFilter = "all";

        } else if (filter === "active") {

            currentFilter = "active";

        } else {

            currentFilter = "completed";

        }

        renderTasks();

    });

});

// Clear Completed Button
clearCompletedBtn.addEventListener("click", function () {

    const completedCount = tasks.filter(task => task.completed).length;

    if (completedCount === 0) {

        alert("There are no completed tasks.");

        return;

    }

    if (confirm("Are you sure you want to remove all completed tasks?")) {

        clearCompleted();

    }

});

// ===============================
// Initial Load
// ===============================

loadTasks();

// ===============================
// Optional Keyboard Shortcut
// Ctrl + / focuses the input box
// ===============================

document.addEventListener("keydown", function (e) {

    if (e.ctrlKey && e.key === "/") {

        e.preventDefault();

        taskInput.focus();

    }

});