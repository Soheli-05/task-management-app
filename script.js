"use strict";

/* =====================================
   1. Application settings and elements
===================================== */

const STORAGE_KEY = "taskflow_tasks_v1";

const taskList = document.getElementById("taskList");
const taskDialog = document.getElementById("taskDialog");
const taskForm = document.getElementById("taskForm");

const addTaskButton = document.getElementById("addTaskButton");
const closeDialogButton = document.getElementById("closeDialogButton");
const cancelButton = document.getElementById("cancelButton");

const taskIdInput = document.getElementById("taskId");
const taskTitleInput = document.getElementById("taskTitle");
const taskDescriptionInput = document.getElementById("taskDescription");
const taskPriorityInput = document.getElementById("taskPriority");
const taskDueDateInput = document.getElementById("taskDueDate");

const dialogTitle = document.getElementById("dialogTitle");
const saveTaskButton = document.getElementById("saveTaskButton");

const searchInput = document.getElementById("searchInput");
const priorityFilter = document.getElementById("priorityFilter");
const sortFilter = document.getElementById("sortFilter");

const totalTasksElement = document.getElementById("totalTasks");
const pendingTasksElement = document.getElementById("pendingTasks");
const completedTasksElement = document.getElementById("completedTasks");
const completionRateElement = document.getElementById("completionRate");

const taskSectionTitle = document.getElementById("taskSectionTitle");
const appAnnouncement = document.getElementById("appAnnouncement");

const navigationButtons = document.querySelectorAll(".nav-item");

let tasks = loadTasks();
let currentFilter = "all";


/* =====================================
   2. Load saved tasks
===================================== */

function loadTasks() {
    try {
        const savedTasks = localStorage.getItem(STORAGE_KEY);

        if (savedTasks === null) {
            return [];
        }

        const parsedTasks = JSON.parse(savedTasks);

        if (!Array.isArray(parsedTasks)) {
            return [];
        }

        // Ignore malformed records in the saved data.
        return parsedTasks.filter(function (task) {
            return (
                task &&
                typeof task.id === "string" &&
                typeof task.title === "string" &&
                typeof task.completed === "boolean" &&
                ["low", "medium", "high"].includes(task.priority)
            );
        });
    } catch (error) {
        console.error("Could not load saved tasks:", error);
        return [];
    }
}


/* =====================================
   3. Save tasks to browser storage
===================================== */

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error("Could not save tasks:", error);

        alert(
            "Your changes could not be saved. " +
            "Check your browser storage or available space."
        );

        return false;
    }
}


/* =====================================
   4. Announce updates accessibly
===================================== */

function announce(message) {
    appAnnouncement.textContent = message;
}


/* =====================================
   5. Update dashboard statistics
===================================== */

function updateStatistics() {
    const total = tasks.length;

    const completed = tasks.filter(function (task) {
        return task.completed;
    }).length;

    const pending = total - completed;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    totalTasksElement.textContent = total;
    pendingTasksElement.textContent = pending;
    completedTasksElement.textContent = completed;
    completionRateElement.textContent = percentage + "%";
}


/* =====================================
   6. Create a new task
===================================== */

function createTask() {
    const title = taskTitleInput.value.trim();
    const description = taskDescriptionInput.value.trim();
    const priority = taskPriorityInput.value;
    const dueDate = taskDueDateInput.value;

    if (!title) {
        taskTitleInput.setCustomValidity("Please enter a task title.");
        taskTitleInput.reportValidity();
        return;
    }

    taskTitleInput.setCustomValidity("");

    if (!["low", "medium", "high"].includes(priority)) {
        alert("Please select a valid priority.");
        return;
    }

    const newTask = {
        id: createTaskId(),
        title: title,
        description: description,
        priority: priority,
        dueDate: dueDate,
        completed: false,
        createdAt: Date.now()
    };

    tasks.unshift(newTask);

    if (!saveTasks()) {
        tasks.shift();
        return;
    }

    taskDialog.close();
    taskForm.reset();

    currentFilter = "all";
    updateActiveNavigation();
    renderTasks();

    announce("Task created successfully.");
}


/* =====================================
   7. Generate a unique task ID
===================================== */

function createTaskId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2)
    );
}


/* =====================================
   8. Open the add-task dialog
===================================== */

function openAddDialog() {
    taskForm.reset();

    taskIdInput.value = "";
    taskTitleInput.setCustomValidity("");

    dialogTitle.textContent = "Create a New Task";
    saveTaskButton.textContent = "Save Task";

    taskDialog.showModal();
    taskTitleInput.focus();
}


/* =====================================
   9. Open the edit-task dialog
===================================== */

function openEditDialog(id) {
    const task = tasks.find(function (item) {
        return item.id === id;
    });

    if (!task) {
        announce("Task not found.");
        return;
    }

    taskForm.reset();

    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskDescriptionInput.value = task.description;
    taskPriorityInput.value = task.priority;
    taskDueDateInput.value = task.dueDate || "";

    taskTitleInput.setCustomValidity("");

    dialogTitle.textContent = "Edit Task";
    saveTaskButton.textContent = "Update Task";

    taskDialog.showModal();
    taskTitleInput.focus();
}


/* =====================================
   10. Update an existing task
===================================== */

function updateTask(id) {
    const index = tasks.findIndex(function (task) {
        return task.id === id;
    });

    if (index === -1) {
        announce("Task not found.");
        return;
    }

    const title = taskTitleInput.value.trim();
    const description = taskDescriptionInput.value.trim();
    const priority = taskPriorityInput.value;
    const dueDate = taskDueDateInput.value;

    if (!title) {
        taskTitleInput.setCustomValidity("Please enter a task title.");
        taskTitleInput.reportValidity();
        return;
    }

    taskTitleInput.setCustomValidity("");

    if (!["low", "medium", "high"].includes(priority)) {
        alert("Please select a valid priority.");
        return;
    }

    const originalTask = { ...tasks[index] };

    tasks[index] = {
        ...tasks[index],
        title: title,
        description: description,
        priority: priority,
        dueDate: dueDate
    };

    if (!saveTasks()) {
        tasks[index] = originalTask;
        return;
    }

    taskDialog.close();
    renderTasks();

    announce("Task updated successfully.");
}


/* =====================================
   11. Save the form
===================================== */

taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const existingId = taskIdInput.value;

    if (existingId) {
        updateTask(existingId);
    } else {
        createTask();
    }
});


/* =====================================
   12. Delete a task
===================================== */

function deleteTask(id) {
    const task = tasks.find(function (item) {
        return item.id === id;
    });

    if (!task) {
        announce("Task not found.");
        return;
    }

    const confirmed = window.confirm(
        'Are you sure you want to delete "' +
        task.title +
        '"?'
    );

    if (!confirmed) {
        return;
    }

    const previousTasks = tasks;

    tasks = tasks.filter(function (item) {
        return item.id !== id;
    });

    if (!saveTasks()) {
        tasks = previousTasks;
        return;
    }

    renderTasks();
    announce("Task deleted successfully.");
}


/* =====================================
   13. Mark a task completed or pending
===================================== */

function toggleTaskCompletion(id) {
    const index = tasks.findIndex(function (task) {
        return task.id === id;
    });

    if (index === -1) {
        announce("Task not found.");
        return;
    }

    const previousStatus = tasks[index].completed;

    tasks[index] = {
        ...tasks[index],
        completed: !previousStatus
    };

    if (!saveTasks()) {
        tasks[index] = {
            ...tasks[index],
            completed: previousStatus
        };
        return;
    }

    renderTasks();

    announce(
        tasks[index].completed
            ? "Task marked as completed."
            : "Task marked as pending."
    );
}


/* =====================================
   14. Filter tasks
===================================== */

function getFilteredTasks() {
    const searchTerm = searchInput.value
        .trim()
        .toLowerCase();

    const selectedPriority = priorityFilter.value;

    let filteredTasks = tasks.filter(function (task) {
        const matchesSearch =
            task.title.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm);

        const matchesPriority =
            selectedPriority === "all" ||
            task.priority === selectedPriority;

        let matchesStatus = true;

        if (currentFilter === "pending") {
            matchesStatus = !task.completed;
        } else if (currentFilter === "completed") {
            matchesStatus = task.completed;
        } else if (currentFilter === "today") {
            matchesStatus =
                !task.completed &&
                task.dueDate === getTodayString();
        }

        return matchesSearch && matchesPriority && matchesStatus;
    });

    const selectedSort = sortFilter.value;

    if (selectedSort === "newest") {
        filteredTasks.sort(function (a, b) {
            return b.createdAt - a.createdAt;
        });
    } else if (selectedSort === "oldest") {
        filteredTasks.sort(function (a, b) {
            return a.createdAt - b.createdAt;
        });
    } else if (selectedSort === "dueDate") {
        filteredTasks.sort(function (a, b) {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;

            return a.dueDate.localeCompare(b.dueDate);
        });
    } else if (selectedSort === "priority") {
        const priorityRank = {
            high: 3,
            medium: 2,
            low: 1
        };

        filteredTasks.sort(function (a, b) {
            return (
                priorityRank[b.priority] -
                priorityRank[a.priority]
            );
        });
    }

    return filteredTasks;
}


/* =====================================
   15. Format a due date
===================================== */

function formatDueDate(dateString) {
    if (!dateString) {
        return "";
    }

    const parts = dateString.split("-");

    if (parts.length !== 3) {
        return dateString;
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    const date = new Date(year, month - 1, day);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return dateString;
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}


/* =====================================
   16. Get today's local date
===================================== */

function getTodayString() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
}


/* =====================================
   17. Safely create task elements
===================================== */

function createTaskCard(task) {
    const card = document.createElement("article");

    card.className = "task-card";

    if (task.completed) {
        card.classList.add("completed");
    }

    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute(
        "aria-label",
        "Mark " + task.title + " as completed"
    );

    checkbox.addEventListener("change", function () {
        toggleTaskCompletion(task.id);
    });

    const details = document.createElement("div");
    details.className = "task-details";

    const title = document.createElement("h3");
    title.className = "task-title";
    title.textContent = task.title;

    details.appendChild(title);

    if (task.description) {
        const description = document.createElement("p");

        description.className = "task-description";
        description.textContent = task.description;

        details.appendChild(description);
    }

    const metadata = document.createElement("div");
    metadata.className = "task-meta";

    const priorityBadge = document.createElement("span");

    priorityBadge.className = "priority-badge priority-" + task.priority;
    priorityBadge.textContent = task.priority + " priority";

    metadata.appendChild(priorityBadge);

    const statusBadge = document.createElement("span");

    statusBadge.className = "status-badge";
    statusBadge.textContent = task.completed ? "Completed" : "Pending";

    metadata.appendChild(statusBadge);

    if (task.dueDate) {
        const dueDate = document.createElement("span");

        dueDate.className = "due-date";
        dueDate.textContent = "Due: " + formatDueDate(task.dueDate);

        if (
            !task.completed &&
            task.dueDate < getTodayString()
        ) {
            dueDate.classList.add("overdue");
            dueDate.textContent += " (Overdue)";
        }

        metadata.appendChild(dueDate);
    }

    details.appendChild(metadata);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editButton = document.createElement("button");

    editButton.type = "button";
    editButton.className = "icon-button";
    editButton.textContent = "✎";
    editButton.setAttribute(
        "aria-label",
        "Edit task: " + task.title
    );

    editButton.addEventListener("click", function () {
        openEditDialog(task.id);
    });

    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "icon-button delete-button";
    deleteButton.textContent = "×";
    deleteButton.setAttribute(
        "aria-label",
        "Delete task: " + task.title
    );

    deleteButton.addEventListener("click", function () {
        deleteTask(task.id);
    });

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    card.appendChild(checkbox);
    card.appendChild(details);
    card.appendChild(actions);

    return card;
}


/* =====================================
   18. Render the task list
===================================== */

function renderTasks() {
    taskList.replaceChildren();

    updateStatistics();

    const filteredTasks = getFilteredTasks();

    if (filteredTasks.length === 0) {
        const emptyState = document.createElement("div");

        emptyState.className = "empty-state";

        const icon = document.createElement("div");
        icon.className = "empty-icon";
        icon.textContent = "✓";

        const heading = document.createElement("h3");
        heading.textContent = "No tasks found";

        const message = document.createElement("p");

        if (tasks.length === 0) {
            message.textContent =
                "Start your productivity journey by adding your first task.";
        } else {
            message.textContent =
                "Try changing your search or filter settings.";
        }

        emptyState.appendChild(icon);
        emptyState.appendChild(heading);
        emptyState.appendChild(message);

        taskList.appendChild(emptyState);

        return;
    }

    const fragment = document.createDocumentFragment();

    filteredTasks.forEach(function (task) {
        fragment.appendChild(createTaskCard(task));
    });

    taskList.appendChild(fragment);
}


/* =====================================
   19. Update active navigation
===================================== */

function updateActiveNavigation() {
    const sectionTitles = {
        all: "All Tasks",
        pending: "Pending Tasks",
        completed: "Completed Tasks",
        today: "Tasks Due Today"
    };

    taskSectionTitle.textContent = sectionTitles[currentFilter];

    navigationButtons.forEach(function (button) {
        const isActive = button.dataset.filter === currentFilter;

        button.classList.toggle("active", isActive);

        button.setAttribute(
            "aria-pressed",
            String(isActive)
        );
    });
}


/* =====================================
   20. Navigation event listeners
===================================== */

navigationButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        currentFilter = button.dataset.filter;

        updateActiveNavigation();
        renderTasks();
    });
});


/* =====================================
   21. Search and sort listeners
===================================== */

searchInput.addEventListener("input", renderTasks);

priorityFilter.addEventListener("change", renderTasks);

sortFilter.addEventListener("change", renderTasks);


/* =====================================
   22. Dialog event listeners
===================================== */

addTaskButton.addEventListener("click", openAddDialog);

closeDialogButton.addEventListener("click", function () {
    taskDialog.close();
});

cancelButton.addEventListener("click", function () {
    taskDialog.close();
});

taskTitleInput.addEventListener("input", function () {
    taskTitleInput.setCustomValidity("");
});


/* =====================================
   23. Start the application
===================================== */

updateActiveNavigation();
renderTasks();

console.log("TaskFlow application started successfully.");