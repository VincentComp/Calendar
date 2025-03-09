document.addEventListener('DOMContentLoaded', () => {
  const taskForm = document.getElementById('task-form');
  const taskTitleInput = document.getElementById('task-title');
  const taskStartDateInput = document.getElementById('task-start-date');
  const taskEndDateInput = document.getElementById('task-end-date');
  const taskStartTimeInput = document.getElementById('task-start-time');
  const taskEndTimeInput = document.getElementById('task-end-time');
  const allDayCheckbox = document.getElementById('all-day');
  const taskList = document.getElementById('task-list');
  const timeInputsDiv = document.getElementById('time-inputs');
  const taskColorInput = document.getElementById('task-color'); // New: Color Group Input
  const filterColorInput = document.getElementById('filter-color'); // New: Filter Input
  let tasks = [];
  let calendar;

  // Initialize the state of time inputs based on the all-day checkbox
  function toggleTimeInputs() {
    if (allDayCheckbox.checked) {
      timeInputsDiv.style.display = 'none';
      // Remove 'required' attribute for all-day event
      taskStartTimeInput.removeAttribute('required');
      taskEndTimeInput.removeAttribute('required');
      taskStartTimeInput.value = '';  // Clear time inputs
      taskEndTimeInput.value = '';
    } else {
      timeInputsDiv.style.display = 'flex';
      // Add 'required' attribute back when not an all-day event
      taskStartTimeInput.setAttribute('required', 'required');
      taskEndTimeInput.setAttribute('required', 'required');
    }
  }

  // Listen for changes on the all-day checkbox
  allDayCheckbox.addEventListener('change', toggleTimeInputs);

  // Initial setup
  toggleTimeInputs();

  // Load tasks from LocalStorage
  if (localStorage.getItem('tasks')) {
    tasks = JSON.parse(localStorage.getItem('tasks'));
  }

  // Function to initialize the calendar
  function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      selectable: true,
      editable: false,
      eventColor: 'gray', // Default event color for "No Group"
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      events: tasks.map(task => ({
        id: task.id,
        title: task.title,
        start: task.start,
        end: task.end,
        allDay: task.allDay,
        color: task.color || 'gray' // Use assigned color or gray
      })),
      dateClick: function(info) {
        // Pre-fill the start date when a date is clicked
        taskStartDateInput.value = info.dateStr;
        // If end date is empty, set it to start date
        if (!taskEndDateInput.value) {
          taskEndDateInput.value = info.dateStr;
        }
        taskTitleInput.focus();
      }
    });
    calendar.render();
  }

  // Function to update calendar events
  function updateCalendar() {
    if (calendar) {
      calendar.removeAllEvents();
      tasks.forEach(task => {
        calendar.addEvent({
          id: task.id,
          title: task.title,
          start: task.start,
          end: task.end,
          allDay: task.allDay,
          color: task.color || 'gray' // Use assigned color or gray
        });
      });
    }
  }

  // Function to render tasks in the task list based on filter
  function renderTasks() {
    taskList.innerHTML = '';
    const filterColor = filterColorInput.value;

    // Filter tasks based on selected color
    const filteredTasks = tasks.filter(task => {
      if (filterColor === 'all') return true;
      if (filterColor === '') return task.color === undefined || task.color === '';
      return task.color === filterColor;
    });

    filteredTasks.forEach((task) => {
      const li = document.createElement('li');
      
      // Dynamically set the border-left color
      li.style.borderLeftColor = task.color || 'gray'; // Use task color or gray

      li.innerHTML = `
        <div class="task-info">
          <span class="task-color-dot" style="background-color: ${task.color || 'gray'};"></span>
          <span class="task-title">${task.title}</span>
          <span class="task-time">${formatEventTime(task)}</span>
        </div>
        <div class="task-actions">
          <button class="edit-btn" data-id="${task.id}" title="Edit Task">
            <!-- Edit Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828zM5 16.5V19h2.5l9.387-9.387-2.5-2.5L5 16.5z"/>
            </svg>
          </button>
          <button class="delete-btn" data-id="${task.id}" title="Delete Task">
            <!-- Delete Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M6 2a2 2 0 00-2 2v1H2v2h1v9a2 2 0 002 2h10a2 2 0 002-2V7h1V5h-2V4a2 2 0 00-2-2H6zm5 14a1 1 0 01-1 1H6a1 1 0 010-2h4a1 1 0 011 1zm3-4H5v7h10v-7z"/>
            </svg>
          </button>
        </div>
      `;
      taskList.appendChild(li);
    });
    updateCalendar();
  }

  // Function to format the event time for display
  function formatEventTime(task) {
    if (task.allDay) {
      return `${formatDate(task.start)} to ${formatDate(task.end)} (All Day)`;
    } else {
      const optionsDate = { year: 'numeric', month: 'short', day: 'numeric' };
      const optionsTime = { hour: '2-digit', minute: '2-digit' };
      const startDate = new Date(task.start);
      const endDate = new Date(task.end);
      const formattedStartDate = startDate.toLocaleDateString(undefined, optionsDate);
      const formattedEndDate = endDate.toLocaleDateString(undefined, optionsDate);
      const formattedStartTime = startDate.toLocaleTimeString([], optionsTime);
      const formattedEndTime = endDate.toLocaleTimeString([], optionsTime);

      if (formattedStartDate === formattedEndDate) {
        return `${formattedStartDate} ${formattedStartTime} - ${formattedEndTime}`;
      } else {
        return `${formattedStartDate} ${formattedStartTime} to ${formattedEndDate} ${formattedEndTime}`;
      }
    }
  }

  // Function to format the date for display
  function formatDate(dateStr) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, options);
  }

  // Function to add or update a task
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = taskTitleInput.value.trim();
    const startDate = taskStartDateInput.value;
    const endDate = taskEndDateInput.value;
    const allDay = allDayCheckbox.checked;
    const color = taskColorInput.value; // New: Get selected color

    // Basic validation
    if (!title || !startDate || !endDate) {
      alert('Please fill in all required fields.');
      return;
    }

    // Ensure end date is not before start date
    if (new Date(endDate) < new Date(startDate)) {
      alert('End date cannot be before start date.');
      return;
    }

    let start, end;
    if (allDay) {
      // For all-day events spanning multiple days, FullCalendar expects end date to be non-inclusive
      start = startDate;
      // Increment end date by one day for FullCalendar
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      end = endDateObj.toISOString().split('T')[0];
    } else {
      const startTime = taskStartTimeInput.value;
      const endTime = taskEndTimeInput.value;

      if (!startTime || !endTime) {
        alert('Please fill in both start time and end time.');
        return;
      }

      // For multi-day timed events, concatenate dates and times
      start = `${startDate}T${startTime}`;
      end = `${endDate}T${endTime}`;

      // Ensure end datetime is after start datetime
      if (new Date(end) <= new Date(start)) {
        alert('End time must be after start time.');
        return;
      }
    }

    // Check if we're editing an existing task
    const editingTaskId = taskForm.getAttribute('data-editing-id');
    if (editingTaskId) {
      // Locate the task by ID
      const taskIndex = tasks.findIndex(task => task.id === editingTaskId);
      if (taskIndex !== -1) {
        // Update the task details
        tasks[taskIndex] = {
          id: editingTaskId, // Retain the same ID
          title,
          start,
          end,
          allDay,
          color: color || '' // Assign color or empty string for "No Group"
        };
        // Remove the editing state
        taskForm.removeAttribute('data-editing-id');
      }
    } else {
      // Create a unique ID for the new task
      const taskId = Date.now().toString();
      tasks.push({ id: taskId, title, start, end, allDay, color: color || '' });
    }

    // Save to LocalStorage
    localStorage.setItem('tasks', JSON.stringify(tasks));

    // Reset the form
    taskForm.reset();
    toggleTimeInputs();

    // Render tasks and update the calendar
    renderTasks();
    if (!editingTaskId) {
      calendar.gotoDate(startDate); // Navigate to the start date of the added task
    }
  });

  // Function to handle task actions (delete/edit)
  taskList.addEventListener('click', (e) => {
    // Handle Delete Button
    if (e.target.closest('.delete-btn')) {
      const btn = e.target.closest('.delete-btn');
      const taskId = btn.getAttribute('data-id');
      if (taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
          // Remove the task by filtering out the matching ID
          tasks = tasks.filter(task => task.id !== taskId);
          localStorage.setItem('tasks', JSON.stringify(tasks));
          renderTasks();
        }
      }
    }

    // Handle Edit Button
    if (e.target.closest('.edit-btn')) {
      const btn = e.target.closest('.edit-btn');
      const taskId = btn.getAttribute('data-id');
      if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          // Populate the form with task details for editing
          taskTitleInput.value = task.title;

          const startDate = task.start.split('T')[0];
          const endDate = task.allDay ? task.end : task.end.split('T')[0];
          taskStartDateInput.value = startDate;
          taskEndDateInput.value = endDate;

          if (task.allDay) {
            allDayCheckbox.checked = true;
            toggleTimeInputs();
          } else {
            allDayCheckbox.checked = false;
            toggleTimeInputs();
            const startTime = task.start.split('T')[1].substring(0,5);
            const endTime = task.end.split('T')[1].substring(0,5);
            taskStartTimeInput.value = startTime;
            taskEndTimeInput.value = endTime;
          }

          // Set the color group
          taskColorInput.value = task.color || '';

          // Set the editing state with the task ID
          taskForm.setAttribute('data-editing-id', taskId);
          
          // Optionally, scroll to the form for better user experience
          window.scrollTo({
            top: taskForm.offsetTop,
            behavior: 'smooth'
          });
        }
      }
    }
  });

  // Function to handle filtering
  filterColorInput.addEventListener('change', () => {
    renderTasks();
  });

  // Function to navigate to event on calendar when a task is clicked
  taskList.addEventListener('click', (e) => {
    // Exclude clicks on Edit and Delete buttons
    if (!e.target.closest('.edit-btn') && !e.target.closest('.delete-btn')) {
      const taskItem = e.target.closest('li');
      if (taskItem) {
        const taskId = taskItem.querySelector('.edit-btn').getAttribute('data-id');
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          // Navigate the calendar to the task's start date
          calendar.gotoDate(task.start);

          // Optionally, highlight the event
          const fcEvent = calendar.getEventById(task.id);
          if (fcEvent) {
            const originalColor = fcEvent.backgroundColor;
            fcEvent.setProp('backgroundColor', 'yellow'); // Highlight color
            setTimeout(() => {
              fcEvent.setProp('backgroundColor', originalColor); // Revert to original color
            }, 2000); // Highlight for 2 seconds
          }
        }
      }
    }
  });

  // Initialize the calendar and render tasks
  initializeCalendar();
  renderTasks();
});