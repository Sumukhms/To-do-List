// --- Move all JavaScript from <script>...</script> here ---
class TaskManager {
  constructor() {
    this.tasks = this.loadTasks();
    this.currentFilter = "all";
    this.taskIdCounter = this.getNextId();
    this.initEventListeners();
    this.render();
    this.setMinDueDate();
    this.startDueSoonChecker();
    // this.initClearAllButton(); // <-- REMOVE or COMMENT OUT this line
  }

  setMinDueDate() {
    const dueDateInput = document.getElementById("dueDateInput");
    if (dueDateInput) {
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, "0");
      const minValue = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate()
      )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
      dueDateInput.min = minValue;
    }
  }

  initEventListeners() {
    const addBtn = document.getElementById("addBtn");
    const taskInput = document.getElementById("taskInput");
    const filterBtns = document.querySelectorAll(".filter-btn");
    const dueDateInput = document.getElementById("dueDateInput");

    addBtn.addEventListener("click", () => this.addTask());
    taskInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.addTask();
    });

    filterBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.setFilter(e.target.dataset.filter);
        this.updateFilterButtons(e.target);
      });
    });

    if (dueDateInput) {
      dueDateInput.addEventListener("focus", () => this.setMinDueDate());
    }
  }

  addTask() {
    const taskInput = document.getElementById("taskInput");
    const prioritySelect = document.getElementById("prioritySelect");
    const dueDateInput = document.getElementById("dueDateInput");
    const text = taskInput.value.trim();
    const dueDate = dueDateInput.value;

    if (!text) {
      taskInput.focus();
      return;
    }

    if (!dueDate) {
      alert("Please select a due date and time.");
      dueDateInput.focus();
      return;
    }
    const due = new Date(dueDate);
    const now = new Date();
    if (due <= now) {
      alert("Due date and time must be in the future.");
      dueDateInput.focus();
      return;
    }

    const task = {
      id: this.taskIdCounter++,
      text: text,
      priority: prioritySelect.value,
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: dueDate,
    };

    this.tasks.unshift(task);
    this.saveTasks();
    taskInput.value = "";
    dueDateInput.value = "";
    taskInput.focus();
    this.render();
  }

  toggleTask(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.render();
      // Animation handled in render with checkbox event
    }
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.saveTasks();
    this.render();
  }

  setFilter(filter) {
    this.currentFilter = filter;
    this.render();
  }

  updateFilterButtons(activeBtn) {
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    activeBtn.classList.add("active");
  }

  getFilteredTasks() {
    let tasks;
    switch (this.currentFilter) {
      case "pending":
        tasks = this.tasks.filter((t) => !t.completed);
        break;
      case "completed":
        tasks = this.tasks.filter((t) => t.completed);
        break;
      case "priority":
        tasks = [...this.tasks];
        break;
      default:
        tasks = [...this.tasks];
    }

    // Sort by priority if filter is "priority"
    if (this.currentFilter === "priority" || this.currentFilter === "all") {
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      tasks.sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      );
    }
    return tasks;
  }

  updateStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter((t) => t.completed).length;
    const pending = total - completed;

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("pendingTasks").textContent = pending;
    document.getElementById("completedTasks").textContent = completed;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  render() {
    const taskList = document.getElementById("taskList");
    const filteredTasks = this.getFilteredTasks();
    const now = new Date();

    // Progress bar
    this.renderProgressBar();

    if (filteredTasks.length === 0) {
      taskList.innerHTML = `
        <div class="empty-state">
            <h3>No tasks found</h3>
            <p>Add some tasks to get started!</p>
        </div>
      `;
    } else {
      taskList.innerHTML = filteredTasks
        .map((task) => {
          // Visual indicator logic
          let extraClass = "";
          if (
            !task.completed &&
            task.dueDate &&
            new Date(task.dueDate) - now <= 30 * 60 * 1000 &&
            new Date(task.dueDate) - now > 0
          ) {
            extraClass = "due-soon";
          } else if (
            !task.completed &&
            task.dueDate &&
            new Date(task.dueDate) - now <= 0
          ) {
            extraClass = "due-passed";
          }
          // Highlight tasks created today
          const created = new Date(task.createdAt);
          if (
            created.getFullYear() === now.getFullYear() &&
            created.getMonth() === now.getMonth() &&
            created.getDate() === now.getDate()
          ) {
            extraClass += " created-today";
          }

          return `
      <div class="task-item ${task.completed ? "completed" : ""}${
            extraClass ? " " + extraClass.trim() : ""
          }" data-id="${
            task.id
          }" role="group" aria-label="Task: ${this.escapeHtml(task.text)}">
          <input type="checkbox" class="task-checkbox" ${
            task.completed ? "checked" : ""
          } onchange="taskManager.toggleTask(${task.id})"
          aria-label="Mark task '${this.escapeHtml(task.text)}' as completed"
          tabindex="0">
          <div class="task-content">
              <div class="task-text" id="task-text-${
                task.id
              }" aria-label="Task name">${this.escapeHtml(task.text)}</div>
              <div class="task-meta">
                  <span class="priority-badge priority-${
                    task.priority
                  }" aria-label="Priority: ${task.priority}">${
            task.priority
          }</span>
                  <span class="task-date" aria-label="Created at ${this.formatDate(
                    task.createdAt
                  )}">Created: ${this.formatDate(task.createdAt)}</span>
                  <span class="task-date" aria-label="Due at ${this.formatDueDate(
                    task.dueDate
                  )}">Due: ${this.formatDueDate(task.dueDate)}</span>
              </div>
          </div>
          <div class="task-actions">
              <button class="edit-btn" onclick="taskManager.editTask(${
                task.id
              })" aria-label="Edit task '${this.escapeHtml(
            task.text
          )}'" tabindex="0">✏️</button>
              <button class="delete-btn" onclick="taskManager.deleteTaskWithAnim(${
                task.id
              })" aria-label="Delete task '${this.escapeHtml(
            task.text
          )}'" tabindex="0">🗑</button>
          </div>
      </div>
    `;
        })
        .join("");

      // Add animation for completed tasks
      document.querySelectorAll(".task-checkbox").forEach((cb) => {
        cb.addEventListener("change", (e) => {
          const parent = e.target.closest(".task-item");
          if (e.target.checked) {
            parent.classList.add("animate-complete");
            setTimeout(() => parent.classList.remove("animate-complete"), 800);
          }
        });
      });
    }

    this.updateStats();
  }

  editTask(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;

    const taskTextDiv = document.getElementById(`task-text-${id}`);
    if (!taskTextDiv) return;
    if (document.getElementById(`edit-input-${id}`)) return;

    // Build editable fields for name, priority, and due date
    taskTextDiv.innerHTML = `
    <input type="text" id="edit-input-${id}" value="${this.escapeHtml(
      task.text
    )}" class="edit-input" aria-label="Edit task name" />
    <select id="edit-priority-${id}" class="priority-select" style="margin-right:8px;" aria-label="Edit priority">
      <option value="low" ${
        task.priority === "low" ? "selected" : ""
      }>Low</option>
      <option value="medium" ${
        task.priority === "medium" ? "selected" : ""
      }>Medium</option>
      <option value="high" ${
        task.priority === "high" ? "selected" : ""
      }>High</option>
    </select>
    <input type="datetime-local" id="edit-due-${id}" value="${
      task.dueDate ? task.dueDate : ""
    }" class="priority-select" style="width:180px;margin-right:8px;" aria-label="Edit due date and time">
    <button class="save-btn" id="save-btn-${id}" aria-label="Save changes" tabindex="0">💾</button>
    <button class="cancel-btn" id="cancel-btn-${id}" aria-label="Cancel editing" tabindex="0">✖️</button>
  `;

    // Set min for due date to now
    const dueInput = document.getElementById(`edit-due-${id}`);
    if (dueInput) {
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, "0");
      const minValue = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate()
      )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
      dueInput.min = minValue;
    }

    // Focus the input
    const input = document.getElementById(`edit-input-${id}`);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    document.getElementById(`save-btn-${id}`).onclick = () => {
      const newText = input.value.trim();
      const newPriority = document.getElementById(`edit-priority-${id}`).value;
      const newDue = dueInput.value;

      if (!newText) return;

      // Validate due date
      if (!newDue) {
        alert("Please select a due date and time.");
        dueInput.focus();
        return;
      }
      const due = new Date(newDue);
      const now = new Date();
      if (due <= now) {
        alert("Due date and time must be in the future.");
        dueInput.focus();
        return;
      }

      task.text = newText;
      task.priority = newPriority;
      task.dueDate = newDue;
      // Reset notification flags if due date or priority changed
      task.notifiedDueSoon = false;
      task.notifiedCompleted = false;
      this.saveTasks();
      this.render();
    };

    document.getElementById(`cancel-btn-${id}`).onclick = () => {
      this.render();
    };

    input.onkeydown = (e) => {
      if (e.key === "Enter") {
        document.getElementById(`save-btn-${id}`).click();
      } else if (e.key === "Escape") {
        document.getElementById(`cancel-btn-${id}`).click();
      }
    };
  }

  formatDueDate(dateString) {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(this.tasks));
  }

  loadTasks() {
    const data = localStorage.getItem("tasks");
    return data ? JSON.parse(data) : [];
  }

  getNextId() {
    return this.tasks.length > 0
      ? Math.max(...this.tasks.map((t) => t.id)) + 1
      : 1;
  }

  startDueSoonChecker() {
    setInterval(() => {
      const now = new Date();
      this.tasks.forEach((task) => {
        if (
          !task.completed &&
          task.dueDate &&
          !task.notifiedDueSoon &&
          new Date(task.dueDate) - now <= 30 * 60 * 1000 &&
          new Date(task.dueDate) - now > 0
        ) {
          this.showColorfulAlert(
            `⏰ Task Due Soon!`,
            `Task: "${task.text}" is due at ${this.formatDueDate(
              task.dueDate
            )}`,
            "#ff9800"
          );
          task.notifiedDueSoon = true;
          this.saveTasks();
        }
        if (
          !task.completed &&
          task.dueDate &&
          !task.notifiedCompleted &&
          new Date(task.dueDate) - now <= 0
        ) {
          this.showColorfulAlert(
            `⏰ Task Overdue!`,
            `Task: "${task.text}" was due at ${this.formatDueDate(
              task.dueDate
            )}`,
            "#f44336" // Red color for overdue
          );
          task.notifiedCompleted = true;
          this.saveTasks();
        }
      });
    }, 60 * 1000);
  }

  showColorfulAlert(title, message, color) {
    const oldAlert = document.getElementById("colorful-alert");
    if (oldAlert) oldAlert.remove();

    const alertDiv = document.createElement("div");
    alertDiv.id = "colorful-alert";
    alertDiv.style.position = "fixed";
    alertDiv.style.top = "30px";
    alertDiv.style.left = "50%";
    alertDiv.style.transform = "translateX(-50%)";
    alertDiv.style.background = color;
    alertDiv.style.color = "#fff";
    alertDiv.style.padding = "20px 40px";
    alertDiv.style.borderRadius = "16px";
    alertDiv.style.boxShadow = "0 8px 32px rgba(0,0,0,0.18)";
    alertDiv.style.fontSize = "1.2rem";
    alertDiv.style.zIndex = "9999";
    alertDiv.style.display = "flex";
    alertDiv.style.flexDirection = "column";
    alertDiv.style.alignItems = "center";
    alertDiv.style.fontWeight = "bold";
    alertDiv.innerHTML = `<div style="font-size:1.4rem;margin-bottom:6px">${title}</div><div>${message}</div>`;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
      alertDiv.remove();
    }, 5000);
  }

  // initClearAllButton() {
  //   // Add button if not present
  //   if (!document.getElementById("clearAllBtn")) {
  //     const btn = document.createElement("button");
  //     btn.id = "clearAllBtn";
  //     btn.textContent = "Clear All";
  //     btn.className = "clear-all-btn";
  //     btn.style.marginBottom = "15px";
  //     btn.style.float = "right";
  //     btn.onclick = () => {
  //       if (confirm("Are you sure you want to delete all tasks?")) {
  //         this.tasks = [];
  //         this.saveTasks();
  //         this.render();
  //       }
  //     };
  //     const container = document.querySelector(".container");
  //     container.insertBefore(
  //       btn,
  //       container.querySelector(".task-input-section")
  //     );
  //   }
  // }

  renderProgressBar() {
    let bar = document.getElementById("progressBarWrap");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "progressBarWrap";
      bar.innerHTML = `
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" id="progressBarFill"></div>
      </div>
      <div class="progress-bar-label" id="progressBarLabel"></div>
    `;
      const container = document.querySelector(".container");
      container.insertBefore(bar, container.querySelector(".task-stats"));
    }
    const total = this.tasks.length;
    const completed = this.tasks.filter((t) => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    document.getElementById("progressBarFill").style.width = percent + "%";
    document.getElementById(
      "progressBarLabel"
    ).textContent = `Progress: ${percent}%`;
  }

  deleteTaskWithAnim(id) {
    const el = document.querySelector(`.task-item[data-id="${id}"]`);
    if (el) {
      el.classList.add("animate-delete");
      setTimeout(() => {
        this.deleteTask(id);
      }, 400);
    } else {
      this.deleteTask(id);
    }
  }
}

// Initialize the task manager
window.taskManager = new TaskManager();

// Add a single sample task for demonstration
if (taskManager.tasks.length === 0) {
  document.getElementById("taskInput").value =
    "Start a new journey with this task!";
  document.getElementById("prioritySelect").value = "high";
  const now = new Date();
  now.setDate(now.getDate() + 1);
  const pad = (n) => n.toString().padStart(2, "0");
  const sampleDue = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  document.getElementById("dueDateInput").value = sampleDue;
  taskManager.addTask();
}
