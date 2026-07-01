const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");

function updateTaskCount() {

    const total = document.querySelectorAll(".task").length;

    taskCount.textContent = `${total} Tasks Left`;

}

function addTask(){

    const text = taskInput.value.trim();

    if(text===""){

        alert("Please enter a task.");

        return;

    }

    const li=document.createElement("li");

    li.className="task";

    li.innerHTML=`

        <div class="left">

            <input type="checkbox">

            <span>${text}</span>

        </div>

        <div class="actions">

            <button class="edit">✏️</button>

            <button class="delete">🗑️</button>

        </div>

    `;

    taskList.appendChild(li);

    taskInput.value="";

    taskInput.focus();

    updateTaskCount();

}

addBtn.addEventListener("click",addTask);

taskInput.addEventListener("keypress",function(e){

    if(e.key==="Enter"){

        addTask();

    }

});

taskList.addEventListener("click",function(e){

    const task=e.target.closest(".task");

    if(!task) return;

    // Delete Task

    if(e.target.classList.contains("delete")){

        task.remove();

        updateTaskCount();

    }

    // Edit Task

    if(e.target.classList.contains("edit")){

        const span=task.querySelector("span");

        const updated=prompt("Edit Task",span.textContent);

        if(updated!==null && updated.trim()!==""){

            span.textContent=updated;

        }

    }

});

taskList.addEventListener("change",function(e){

    if(e.target.type==="checkbox"){

        const span=e.target.nextElementSibling;

        span.classList.toggle("completed");

    }

});

updateTaskCount();