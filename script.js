// script.js

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

  // Function to add a task
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = taskTitleInput.value.trim();
    const startDate = taskStartDateInput.value;
    const endDate = taskEndDateInput.value;
    const allDay = allDayCheckbox.checked;
    
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

    tasks.push({ title, start, end, allDay });
    localStorage.setItem('tasks', JSON.stringify(tasks));
    taskForm.reset();
    toggleTimeInputs();
    renderTasks();
    calendar.gotoDate(startDate); // Navigate to the start date of the added task
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