// script.js

document.addEventListener('DOMContentLoaded', () => {
  const taskForm = document.getElementById('task-form');
  const taskTitleInput = document.getElementById('task-title');
  const taskDateInput = document.getElementById('task-date');
  const taskStartTimeInput = document.getElementById('task-start-time');
  const taskEndTimeInput = document.getElementById('task-end-time');
  const allDayCheckbox = document.getElementById('all-day');
  const taskList = document.getElementById('task-list');
  const timeInputsDiv = document.getElementById('time-inputs');
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
      eventColor: '#007bff',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      events: tasks.map(task => ({
        title: task.title,
        start: task.start,
        end: task.end,
        allDay: task.allDay
      })),
      dateClick: function(info) {
        // Pre-fill the date when a date is clicked
        taskDateInput.value = info.dateStr;
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
          title: task.title,
          start: task.start,
          end: task.end,
          allDay: task.allDay
        });
      });
    }
  }

  // Function to render tasks in the task list
  function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${task.title} - ${formatEventTime(task)}</span>
        <button data-index="${index}">Delete</button>
      `;
      taskList.appendChild(li);
    });
    updateCalendar();
  }

  // Function to format the event time for display
  function formatEventTime(task) {
    if (task.allDay) {
      return `${formatDate(task.start)} (All Day)`;
    } else {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      const optionsTime = { hour: '2-digit', minute: '2-digit' };
      const startDate = new Date(task.start);
      const endDate = new Date(task.end);
      const formattedDate = startDate.toLocaleDateString(undefined, options);
      const formattedStartTime = startDate.toLocaleTimeString([], optionsTime);
      const formattedEndTime = endDate.toLocaleTimeString([], optionsTime);
      return `${formattedDate} ${formattedStartTime} - ${formattedEndTime}`;
    }
  }

  // Function to format the date for display
  function formatDate(dateStr) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, options);
  }

  // Function to add a task
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = taskTitleInput.value.trim();
    const date = taskDateInput.value;
    const allDay = allDayCheckbox.checked;
    
    if (title && date) {
      let start, end;
      if (allDay) {
        start = date;
        // Use FullCalendar's all-day setting correctly without altering the end date
        end = start; // Just use the same day for all-day events
      } else {
        const startTime = taskStartTimeInput.value;
        const endTime = taskEndTimeInput.value;

        if (!startTime || !endTime) {
          alert('Please fill in both start time and end time.');
          return;
        }

        // Ensure end time is after start time
        if (endTime <= startTime) {
          alert('End time must be after start time.');
          return;
        }

        start = `${date}T${startTime}`;
        end = `${date}T${endTime}`;
      }

      tasks.push({ title, start, end, allDay });
      localStorage.setItem('tasks', JSON.stringify(tasks));
      taskForm.reset();
      toggleTimeInputs();
      renderTasks();
      calendar.gotoDate(date); // Optional: Navigate to the added task's date
    } else {
      alert('Please fill in all required fields.');
    }
  });

  // Function to delete a task
  taskList.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      const index = e.target.getAttribute('data-index');
      if (index !== null) {
        tasks.splice(index, 1);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
      }
    }
  });

  // Initialize the calendar and render tasks
  initializeCalendar();
  renderTasks();
});