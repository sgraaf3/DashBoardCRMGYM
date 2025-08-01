export default class CalendarView {
    constructor(app) {
        this.app = app;
        this.currentDate = new Date();
        this.selectedDate = null;
    }

    render(container) {
        container.innerHTML = `
            <div class="view-header">
                <h1>Workout Planning Calendar</h1>
                <div class="calendar-navigation">
                    <button id="prevMonthBtn">&lt; Prev</button>
                    <h2 id="currentMonthYear"></h2>
                    <button id="nextMonthBtn">Next &gt;</button>
                </div>
            </div>
            <div class="calendar-grid-container">
                <div class="calendar-weekdays"></div>
                <div class="calendar-days-grid"></div>
            </div>
            <div class="widget" style="margin-top: 20px;">
                <h3>Scheduled Workouts for <span id="selectedDateDisplay">Selected Day</span></h3>
                <ul id="scheduledWorkoutsList" class="list-group"><li>Select a date to see scheduled workouts.</li></ul>
                <button id="assignWorkoutBtn" class="btn btn-primary" style="margin-top: 10px; display: none;">Assign Workout</button>
            </div>
        `;

        this.currentMonthYearElement = container.querySelector('#currentMonthYear');
        this.calendarDaysGrid = container.querySelector('.calendar-days-grid');
        this.scheduledWorkoutsList = container.querySelector('#scheduledWorkoutsList');
        this.selectedDateDisplay = container.querySelector('#selectedDateDisplay');
        this.assignWorkoutBtn = container.querySelector('#assignWorkoutBtn');

        this.addEventListeners(container);
        this.updateCalendar();
    }

    addEventListeners(container) {
        container.querySelector('#prevMonthBtn').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.updateCalendar();
        });

        container.querySelector('#nextMonthBtn').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.updateCalendar();
        });

        this.calendarDaysGrid.addEventListener('click', (e) => {
            const targetDay = e.target.closest('.calendar-day');
            if (targetDay && !targetDay.classList.contains('empty')) {
                const day = parseInt(targetDay.dataset.day);
                const month = this.currentDate.getMonth();
                const year = this.currentDate.getFullYear();
                this.selectedDate = new Date(year, month, day);
                this.displayScheduledWorkouts(this.selectedDate);
                this.highlightSelectedDay(targetDay);
                this.assignWorkoutBtn.style.display = 'block';
            }
        });

        this.assignWorkoutBtn.addEventListener('click', () => {
            if (this.selectedDate) {
                this.app.router.navigate('#/assign-workout', { selectedDate: this.selectedDate.toISOString() });
            }
        });
    }

    updateCalendar() {
        this.currentMonthYearElement.textContent = this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        this.renderWeekdays();
        this.renderDays();
        this.scheduledWorkoutsList.innerHTML = '<li>Select a date to see scheduled workouts.</li>';
        this.selectedDateDisplay.textContent = 'Selected Day';
        this.assignWorkoutBtn.style.display = 'none';
        this.highlightSelectedDay(null); // Clear selection
    }

    renderWeekdays() {
        const weekdaysContainer = this.calendarDaysGrid.previousElementSibling;
        weekdaysContainer.innerHTML = '';
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        weekdays.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-weekday');
            dayElement.textContent = day;
            weekdaysContainer.appendChild(dayElement);
        });
    }

    renderDays() {
        this.calendarDaysGrid.innerHTML = '';
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const startDayIndex = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, etc.

        // Fill in leading empty days
        for (let i = 0; i < startDayIndex; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('calendar-day', 'empty');
            this.calendarDaysGrid.appendChild(emptyDay);
        }

        // Fill in days of the month
        for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            dayElement.dataset.day = day;
            dayElement.textContent = day;
            this.calendarDaysGrid.appendChild(dayElement);
        }
    }

    displayScheduledWorkouts(date) {
        this.selectedDateDisplay.textContent = date.toLocaleDateString();
        const scheduled = this.app.dataStore.getScheduledWorkouts().filter(workout => {
            const workoutDate = new Date(workout.date);
            return workoutDate.toDateString() === date.toDateString();
        });

        if (scheduled.length > 0) {
            this.scheduledWorkoutsList.innerHTML = scheduled.map(workout => {
                const member = this.app.dataStore.getMemberById(workout.memberId);
                const schema = this.app.dataStore.getWorkoutSchema(workout.schemaId);
                return `
                    <li class="list-group-item">
                        <span>${member ? member.name : 'Unknown Member'} - ${schema ? schema.name : 'Unknown Workout'}</span>
                        <button class="btn btn-sm btn-danger delete-scheduled-workout" data-id="${workout.id}">Delete</button>
                    </li>
                `;
            }).join('');
            this.scheduledWorkoutsList.querySelectorAll('.delete-scheduled-workout').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const workoutId = e.target.dataset.id;
                    await this.app.dataStore.deleteScheduledWorkout(workoutId);
                    this.app.uiManager.showNotification('Scheduled workout deleted.', 'success');
                    this.displayScheduledWorkouts(date); // Re-render list for current date
                });
            });
        } else {
            this.scheduledWorkoutsList.innerHTML = `<li>No workouts scheduled for ${date.toLocaleDateString()}.</li>`;
        }
    }

    highlightSelectedDay(selectedDayElement) {
        this.calendarDaysGrid.querySelectorAll('.calendar-day.selected').forEach(day => {
            day.classList.remove('selected');
        });
        if (selectedDayElement) {
            selectedDayElement.classList.add('selected');
        }
    }
}
