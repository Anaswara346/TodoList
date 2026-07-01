// Select Elements
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");

// Function to Add Task
function addTask() {

    // Get input value
    const taskText = taskInput.value.trim();

    // Prevent empty tasks
    if (taskText === "") {
        alert("Please enter a task.");
        return;
    }

    // Create list item
    const li = document.createElement("li");

    li.textContent = taskText;

    // Add some temporary styling
    li.style.background = "#f8fafc";
    li.style.padding = "15px";
    li.style.marginBottom = "10px";
    li.style.borderRadius = "10px";
    li.style.border = "1px solid #ddd";

    // Add task to list
    taskList.appendChild(li);

    // Clear input field
    taskInput.value = "";

    // Focus back on input
    taskInput.focus();
}

// Add task on button click
addBtn.addEventListener("click", addTask);

// Add task when Enter key is pressed
taskInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        addTask();
    }
});