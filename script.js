document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const taskList = document.getElementById('task-list');
    const addTaskFab = document.getElementById('add-task-fab');
    const taskModal = document.getElementById('task-modal');
    const closeButton = document.querySelector('.modal .close-button');
    const taskForm = document.getElementById('task-form');
    const modalTitle = document.getElementById('modal-title');
    const taskIdInput = document.getElementById('task-id');
    const modalTaskTitle = document.getElementById('modal-task-title');
    const modalTaskDescription = document.getElementById('modal-task-description');
    const modalTaskDate = document.getElementById('modal-task-date');
    const modalTaskTime = document.getElementById('modal-task-time');
    const modalTaskPriority = document.getElementById('modal-task-priority');
    const modalTaskCategory = document.getElementById('modal-task-category');

    const filterStatusSelect = document.getElementById('filter-status');
    const sortByCategory = document.getElementById('sort-by');
    const searchInput = document.getElementById('search-input');
    const categoryListItems = document.querySelectorAll('.sidebar .list-item');
    const themeToggle = document.getElementById('theme-toggle');
    const reminderNotification = document.getElementById('reminder-notification');
    const reminderText = document.getElementById('reminder-text');

    let tasks = [];
    let currentFilterCategory = 'All Tasks';
    let currentFilterStatus = 'all';
    let currentSortBy = 'dueDate';
    let reminderTimeout; // To clear any active reminder timeouts

    // --- Utility Functions ---

    function generateUniqueId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const storedTasks = localStorage.getItem('tasks');
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
            // Ensure addedDate exists for older tasks if necessary
            tasks.forEach(task => {
                if (!task.addedDate) {
                    task.addedDate = new Date().toISOString(); // Set current time as added date
                }
            });
            saveTasks(); // Resave to update with addedDate
        } else {
            // Pre-added example tasks with realistic dates and priorities
            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0);

            const nextSunday = new Date();
            nextSunday.setDate(now.getDate() + (7 - now.getDay()) % 7);
            nextSunday.setHours(23, 59, 0, 0);

            const yesterday = new Date();
            yesterday.setDate(now.getDate() - 1);
            yesterday.setHours(10, 0, 0, 0);

            tasks = [
                {
                    id: generateUniqueId(),
                    title: 'Buy groceries',
                    description: 'Milk, bread, eggs, vegetables, fruits.',
                    dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0).toISOString(), // Today 6 PM
                    priority: 'medium',
                    category: 'Shopping',
                    completed: false,
                    addedDate: new Date().toISOString()
                },
                {
                    id: generateUniqueId(),
                    title: 'Complete frontend UI',
                    description: 'Implement the task list, modal, and animations.',
                    dueDate: tomorrow.toISOString(),
                    priority: 'high',
                    category: 'Work',
                    completed: false,
                    addedDate: new Date().toISOString()
                },
                {
                    id: generateUniqueId(),
                    title: 'Submit assignment',
                    description: 'Mathematics assignment for college, chapter 5-8.',
                    dueDate: nextSunday.toISOString(),
                    priority: 'high',
                    category: 'Personal',
                    completed: false,
                    addedDate: new Date().toISOString()
                },
                {
                    id: generateUniqueId(),
                    title: 'Call mom',
                    description: 'Wish her a happy birthday!',
                    dueDate: yesterday.toISOString(), // Yesterday 10 AM (for overdue demo)
                    priority: 'low',
                    category: 'Personal',
                    completed: false,
                    addedDate: new Date().toISOString()
                },
                {
                    id: generateUniqueId(),
                    title: 'Schedule dentist appointment',
                    description: 'Check for available slots next month.',
                    dueDate: null, // No due date
                    priority: 'low',
                    category: 'Personal',
                    completed: false,
                    addedDate: new Date().toISOString()
                },
                {
                    id: generateUniqueId(),
                    title: 'Team meeting agenda',
                    description: 'Prepare presentation slides for Monday meeting.',
                    dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 10, 0).toISOString(),
                    priority: 'medium',
                    category: 'Work',
                    completed: false,
                    addedDate: new Date().toISOString()
                },
                 {
                    id: generateUniqueId(),
                    title: 'Book flight tickets',
                    description: 'For summer vacation to Goa.',
                    dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 14, 0).toISOString(),
                    priority: 'high',
                    category: 'Personal',
                    completed: false,
                    addedDate: new Date().toISOString()
                }
            ];
            saveTasks();
        }
        renderTasks();
    }

    function formatDateTime(isoString) {
        if (!isoString) return { date: 'No due date', time: '' };
        const date = new Date(isoString);
        const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
        return {
            date: date.toLocaleDateString(undefined, dateOptions),
            time: date.toLocaleTimeString(undefined, timeOptions)
        };
    }

    function getTimeRemaining(isoString) {
        if (!isoString) return null;
        const now = new Date();
        const due = new Date(isoString);
        const diffMs = due - now;

        if (diffMs < 0) {
            const absDiff = Math.abs(diffMs);
            const minutes = Math.floor(absDiff / (1000 * 60));
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (days > 0) return { text: `${days}d overdue`, status: 'overdue' };
            if (hours > 0) return { text: `${hours}h overdue`, status: 'overdue' };
            if (minutes > 0) return { text: `${minutes}m overdue`, status: 'overdue' };
            return { text: 'Now overdue', status: 'overdue' };
        } else {
            const minutes = Math.floor(diffMs / (1000 * 60));
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (days > 0) return { text: `Due in ${days}d`, status: 'due-in' };
            if (hours > 0) return { text: `Due in ${hours}h`, status: 'due-in' };
            if (minutes > 0) return { text: `Due in ${minutes}m`, status: 'due-in' };
            return { text: 'Due soon', status: 'due-in' };
        }
    }

    function isOverdue(dueDate, completed) {
        if (completed || !dueDate) return false;
        const now = new Date();
        const due = new Date(dueDate);
        return due < now;
    }

    // --- Render Tasks ---
    function renderTasks() {
        // Clear existing tasks and messages immediately
        taskList.innerHTML = '';

        const currentTasks = tasks
            .filter(task => {
                const matchesCategory = currentFilterCategory === 'All Tasks' || task.category === currentFilterCategory;
                const matchesStatus = currentFilterStatus === 'all' ||
                                    (currentFilterStatus === 'pending' && !task.completed) ||
                                    (currentFilterStatus === 'completed' && task.completed);
                const matchesSearch = searchInput.value.trim() === '' ||
                                      task.title.toLowerCase().includes(searchInput.value.toLowerCase()) ||
                                      task.description.toLowerCase().includes(searchInput.value.toLowerCase());
                return matchesCategory && matchesStatus && matchesSearch;
            })
            .sort((a, b) => {
                if (currentSortBy === 'dueDate') {
                    // Sort by completion (incomplete first), then overdue (overdue first), then by date
                    if (a.completed !== b.completed) return a.completed ? 1 : -1;
                    const aOverdue = isOverdue(a.dueDate, a.completed);
                    const bOverdue = isOverdue(b.dueDate, b.completed);
                    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1; // Overdue first
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                } else if (currentSortBy === 'priority') {
                    const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                } else if (currentSortBy === 'addedDate') {
                    return new Date(b.addedDate) - new Date(a.addedDate); // Newest first
                }
                return 0;
            });

        if (currentTasks.length === 0) {
            const noTasksMessage = document.createElement('div');
            noTasksMessage.className = 'no-tasks-message';
            noTasksMessage.innerHTML = `<i class="far fa-clipboard" style="font-size: 3rem; margin-bottom: 15px; display: block;"></i> No tasks match your current criteria.`;
            taskList.appendChild(noTasksMessage);
            return;
        }

        currentTasks.forEach(task => {
            const { date: formattedDate, time: formattedTime } = formatDateTime(task.dueDate);
            const timeInfo = getTimeRemaining(task.dueDate);

            const taskItem = document.createElement('div');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''} ${isOverdue(task.dueDate, task.completed) ? 'overdue' : ''} entering`;
            taskItem.dataset.id = task.id;
            taskItem.dataset.priority = task.priority;

            taskItem.innerHTML = `
                <div class="task-content">
                    <button class="task-toggle-button">
                        <i class="${task.completed ? 'far fa-check-circle' : 'far fa-circle'}"></i>
                    </button>
                    <div>
                        <h3 class="task-title">${task.title}</h3>
                        <p class="task-description">${task.description || 'No description.'}</p>
                    </div>
                </div>
                <div class="task-meta">
                    <span><i class="far fa-calendar-alt"></i> ${formattedDate}</span>
                    ${task.dueDate ? `<span><i class="far fa-clock"></i> ${formattedTime}</span>` : ''}
                    <span class="priority-label ${task.priority}">${task.priority} Priority</span>
                    <span class="time-info ${timeInfo ? timeInfo.status : ''}">${timeInfo ? timeInfo.text : ''}</span>
                    <span><i class="fas fa-tag"></i> ${task.category}</span>
                </div>
                <div class="task-actions">
                    <button class="action-button edit"><i class="fas fa-edit"></i></button>
                    <button class="action-button delete"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            taskList.appendChild(taskItem);
        });
    }

    // --- Modal Functions ---

    function showModal(task = null) {
        taskModal.classList.add('show');
        if (task) {
            modalTitle.textContent = 'Edit Task';
            taskIdInput.value = task.id;
            modalTaskTitle.value = task.title;
            modalTaskDescription.value = task.description || '';
            modalTaskPriority.value = task.priority;
            modalTaskCategory.value = task.category;

            if (task.dueDate) {
                const date = new Date(task.dueDate);
                modalTaskDate.value = date.toISOString().substring(0, 10);
                modalTaskTime.value = date.toTimeString().substring(0, 5);
            } else {
                modalTaskDate.value = '';
                modalTaskTime.value = '';
            }
        } else {
            modalTitle.textContent = 'Add New Task';
            taskForm.reset(); // Clear form for new task
            taskIdInput.value = ''; // Ensure no ID for new task
            modalTaskPriority.value = 'medium'; // Default priority
            modalTaskCategory.value = currentFilterCategory === 'All Tasks' ? 'Personal' : currentFilterCategory;
            // Set default date to today and time to current time + 1 hour
            const now = new Date();
            now.setHours(now.getHours() + 1);
            modalTaskDate.value = now.toISOString().substring(0, 10);
            modalTaskTime.value = now.toTimeString().substring(0, 5);
        }
    }

    function hideModal() {
        taskModal.classList.remove('show');
    }

    // --- Event Listeners ---

    // Add Task FAB Button
    addTaskFab.addEventListener('click', () => showModal());
    closeButton.addEventListener('click', hideModal);
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            hideModal(); // Close modal when clicking outside content
        }
    });

    // Task Form Submission (Add/Edit)
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const id = taskIdInput.value;
        const title = modalTaskTitle.value.trim();
        const description = modalTaskDescription.value.trim();
        const date = modalTaskDate.value;
        const time = modalTaskTime.value;
        const priority = modalTaskPriority.value;
        const category = modalTaskCategory.value;

        if (!title) {
            alert('Task title is required!');
            return;
        }

        let dueDate = null;
        if (date && time) {
            dueDate = new Date(`${date}T${time}`).toISOString();
        } else if (date) {
            dueDate = new Date(date).toISOString();
        }

        if (id) {
            // Edit existing task
            const taskIndex = tasks.findIndex(task => task.id === id);
            if (taskIndex > -1) {
                tasks[taskIndex] = { ...tasks[taskIndex], title, description, dueDate, priority, category };
            }
        } else {
            // Add new task
            const newTask = {
                id: generateUniqueId(),
                title,
                description,
                dueDate,
                priority,
                category,
                completed: false,
                addedDate: new Date().toISOString()
            };
            tasks.push(newTask);
        }

        saveTasks();
        renderTasks();
        hideModal();
    });

    // Handle task item clicks (toggle complete, edit, delete)
    taskList.addEventListener('click', (e) => {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;

        const taskId = taskItem.dataset.id;
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return;

        if (e.target.closest('.task-toggle-button')) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            saveTasks();
            renderTasks(); // Re-render to apply strikethrough/dim and sorting
        } else if (e.target.closest('.action-button.edit')) {
            showModal(tasks[taskIndex]);
        } else if (e.target.closest('.action-button.delete')) {
            if (confirm('Are you sure you want to delete this task?')) {
                // Add 'leaving' class for animation
                taskItem.classList.add('leaving');
                taskItem.addEventListener('animationend', () => {
                    tasks.splice(taskIndex, 1);
                    saveTasks();
                    renderTasks(); // Re-render to ensure filter/sort is correct
                }, { once: true });
            }
        }
    });

    // --- Filtering and Sorting ---
    filterStatusSelect.addEventListener('change', (e) => {
        currentFilterStatus = e.target.value;
        renderTasks();
    });

    sortByCategory.addEventListener('change', (e) => {
        currentSortBy = e.target.value;
        renderTasks();
    });

    searchInput.addEventListener('input', () => {
        renderTasks();
    });

    // Category Filter in Sidebar
    categoryListItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active from all and add to clicked
            categoryListItems.forEach(li => li.classList.remove('active'));
            item.classList.add('active');
            currentFilterCategory = item.dataset.category;
            renderTasks();
        });
    });

    // --- Theme Toggle ---
    themeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode', themeToggle.checked);
        localStorage.setItem('theme', themeToggle.checked ? 'dark' : 'light');
    });

    function loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.checked = true;
        } else {
            document.body.classList.remove('dark-mode');
            themeToggle.checked = false;
        }
    }

    // --- Reminder Notification ---
    function showReminder(message) {
        clearTimeout(reminderTimeout); // Clear any existing timeout
        reminderText.textContent = message;
        reminderNotification.classList.remove('fadeOut');
        reminderNotification.classList.add('show');

        // Automatically hide after a few seconds
        reminderTimeout = setTimeout(() => {
            reminderNotification.classList.remove('show');
            reminderNotification.classList.add('fadeOut');
        }, 5000);
    }

    window.hideReminder = () => { // Make available globally for inline onclick
        clearTimeout(reminderTimeout);
        reminderNotification.classList.remove('show');
        reminderNotification.classList.add('fadeOut');
    };

    function checkReminders() {
        const now = new Date();
        // Get tasks due within the next 30 minutes that are not completed
        const upcomingTasks = tasks.filter(task => {
            if (task.completed || !task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            const diffMinutes = (dueDate - now) / (1000 * 60);
            return diffMinutes > 0 && diffMinutes <= 30; // Due in next 30 mins
        });

        if (upcomingTasks.length > 0) {
            const nextTask = upcomingTasks[0]; // Show the closest one
            showReminder(`"${nextTask.title}" is due soon!`);
        }
    }

    // Update available categories in the modal based on existing tasks
    function updateCategoryOptions() {
        const uniqueCategories = new Set(tasks.map(task => task.category));
        // Add default categories if they don't exist
        ['Personal', 'Work', 'Shopping'].forEach(cat => uniqueCategories.add(cat));

        modalTaskCategory.innerHTML = ''; // Clear existing options
        uniqueCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            modalTaskCategory.appendChild(option);
        });
        // Ensure "All Tasks" is not an option for assigning a task
        const allTasksOption = modalTaskCategory.querySelector('option[value="All Tasks"]');
        if (allTasksOption) allTasksOption.remove();
    }


    // --- Initial Load ---
    loadTheme();
    loadTasks();
    updateCategoryOptions();
    setInterval(checkReminders, 60000); // Check for reminders every minute
});