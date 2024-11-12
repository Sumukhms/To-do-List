// script.js

let tasks = [];
let editTaskId = null; // Variable to store the task ID being edited

function addTask() {
    const taskInput = document.getElementById("task-input");
    const taskDate = document.getElementById("task-date");

    const taskText = taskInput.value.trim();
    const taskDueDate = taskDate.value;

    if (taskText === "") {
        alert("Please enter a task");
        return;
    }

    const task = {
        id: Date.now(),
        text: taskText,
        dueDate: taskDueDate,
        completed: false,
    };

    tasks.push(task);
    taskInput.value = "";
    taskDate.value = "";
    renderTasks();
}

function renderTasks() {
    const taskList = document.getElementById("task-list");
    taskList.innerHTML = "";

    tasks.forEach(task => {
        const taskItem = document.createElement("li");
        taskItem.className = `task ${task.completed ? "completed" : ""}`;

        taskItem.innerHTML = `
            <span onclick="toggleComplete(${task.id})">
                ${task.text}
                <small>Due: ${task.dueDate ? new Date(task.dueDate).toLocaleString() : "No date"}</small>
            </span>
            <div class="actions">
                <button class="complete-button" onclick="toggleComplete(${task.id})" title="Mark as Complete">&#10004;</button>
                <button onclick="openModal(${task.id})" title="Edit">&#9998;</button>
                <button onclick="deleteTask(${task.id})" title="Delete">&#10060;</button>
            </div>
        `;

        taskList.appendChild(taskItem);
    });
}

function toggleComplete(id) {
    const task = tasks.find(task => task.id === id);
    task.completed = !task.completed;
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    renderTasks();
}

function openModal(id) {
    editTaskId = id;
    const task = tasks.find(task => task.id === id);

    // Populate modal fields with current task data
    document.getElementById("edit-task-input").value = task.text;
    document.getElementById("edit-task-date").value = task.dueDate || "";

    // Show the modal
    document.getElementById("edit-modal").style.display = "flex";
}

function closeModal() {
    document.getElementById("edit-modal").style.display = "none";
}

function saveTask() {
    const task = tasks.find(task => task.id === editTaskId);

    // Get updated values from modal inputs
    const newText = document.getElementById("edit-task-input").value.trim();
    const newDate = document.getElementById("edit-task-date").value;

    if (newText !== "") {
        task.text = newText;
    }
    task.dueDate = newDate || task.dueDate;

    closeModal();
    renderTasks();
}

document.addEventListener("DOMContentLoaded", () => {
    renderTasks();
});
