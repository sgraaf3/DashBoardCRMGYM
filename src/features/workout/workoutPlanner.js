import { debounce } from '../../core/utils.js';

export default class WorkoutPlanner {
    constructor(app) {
        this.app = app;
        this.currentDate = new Date();
        this.selectedDate = null;
        this.selectedMemberId = null;
        this.searchTerm = '';
        this.isCopyMode = false;
        this.sourceWeekStart = null;
        this.showLessons = true; // Default to showing lessons
        this.lessonCategoryFilter = 'all';
    }

    render(container, _model, routeData) {
        // Handle prefill data from router
        if (routeData && routeData.prefill) {
            this.selectedMemberId = routeData.prefill.userId;
            this.selectedDate = new Date(routeData.prefill.date);
            this.currentDate = new Date(routeData.prefill.date); // Navigate calendar to the prefilled month
            this.app.uiManager.showNotification(`Showing schedule for ${this.app.dataStore.getMemberById(this.selectedMemberId)?.name} on ${this.selectedDate.toLocaleDateString()}`, 'info');
        } else {
            // If no prefill, and no member is selected yet, default to "All Members"
            if (!this.selectedMemberId) {
                this.selectedMemberId = 'all';
            }
            if (!this.selectedDate) {
                this.selectedDate = new Date();
            }
        }

        const members = this.app.dataStore.getMembers();
        const isGlobalView = this.selectedMemberId === 'all';
        const allMembersOption = `<option value="all" ${isGlobalView ? 'selected' : ''}>All Members</option>`;
        const memberOptions = members.map(member =>
            `<option value="${member.id}" ${member.id == this.selectedMemberId ? 'selected' : ''}>${member.name}</option>`
        ).join('');

        const lessonTemplates = this.app.dataStore.getLessonTemplates();
        const lessonCategories = ['all', ...new Set(lessonTemplates.map(t => t.mainSection).filter(Boolean))];
        const categoryOptions = lessonCategories.map(cat =>
            `<option value="${cat}" ${this.lessonCategoryFilter === cat ? 'selected' : ''}>${cat === 'all' ? 'All Categories' : cat}</option>`
        ).join('');

        container.innerHTML = `
            <div class="view-header">
                <h1>Workout Planner</h1>
            </div>
            <div class="view-controls">
                <div class="search-wrapper">
                    <input type="search" id="workout-search" class="form-control" placeholder="Search workouts..." value="${this.searchTerm || ''}">
                    ${this.searchTerm ? `<button id="clear-search-btn" class="btn-icon" title="Clear Search">&times;</button>` : ''}
                </div>
                <div class="member-list-controls">
                    <label for="member-select">Select Member:</label>
                    <select id="member-select" class="form-control">${allMembersOption}${memberOptions}</select>
                </div>
                <div class="form-group form-switch-group">
                    <label class="form-switch">
                        <input type="checkbox" id="show-lessons-toggle" ${this.showLessons ? 'checked' : ''}>
                        <i></i> Show Gym Lessons
                    </label>
                </div>
                <div class="form-group">
                    <label for="lesson-category-filter" class="sr-only">Filter by Category:</label>
                    <select id="lesson-category-filter" class="form-control form-control-sm" ${!this.showLessons ? 'disabled' : ''}>${categoryOptions}</select>
                </div>
            </div>
            <div class="widget">
                <div class="calendar-navigation">
                    <button id="prev-month-btn" class="btn">&lt; Prev</button>
                    <div class="calendar-title-group">
                        <h2 id="current-month-year"></h2>
                        <button id="today-btn" class="btn btn-sm">Today</button>
                        <button id="copy-week-btn" class="btn btn-sm" ${isGlobalView ? 'disabled' : ''}>Copy Week</button>
                        <button id="clear-week-btn" class="btn btn-sm btn-danger" ${isGlobalView ? 'disabled' : ''}>Clear Week</button>
                    </div>
                    <button id="next-month-btn" class="btn">Next &gt;</button>
                </div>
                <div class="calendar-grid-container">
                    <div class="calendar-weekdays">
                        <div class="calendar-weekday">Sun</div><div class="calendar-weekday">Mon</div><div class="calendar-weekday">Tue</div><div class="calendar-weekday">Wed</div><div class="calendar-weekday">Thu</div><div class="calendar-weekday">Fri</div><div class="calendar-weekday">Sat</div>
                    </div>
                    <div id="calendar-days" class="calendar-days-grid" role="grid" tabindex="0" aria-label="Workout Calendar"></div>
                </div>
            </div>
            <div id="weekly-notes-container" class="widget" style="margin-top: 2rem; display: ${isGlobalView ? 'none' : 'block'};">
                <!-- Weekly notes will be rendered here -->
            </div>
        `;

        this.renderCalendar();
        this.renderWeeklyNotes();
        this.addEventListeners(container);
    }

    renderCalendar() {
        const calendarGrid = document.getElementById('calendar-days');
        const monthYearEl = document.getElementById('current-month-year');
        if (!calendarGrid || !monthYearEl) return;

        calendarGrid.innerHTML = '';
        const month = this.currentDate.getMonth();
        const year = this.currentDate.getFullYear();

        monthYearEl.textContent = this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const allScheduledWorkouts = this.app.dataStore.getScheduledWorkouts();
        const allScheduledLessons = this.showLessons ? this.app.dataStore.getScheduledLessons() : [];

        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarGrid.innerHTML += `<div class="calendar-day empty"></div>`;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(year, month, day);
            const dateStr = dayDate.toISOString().split('T')[0];

            const workoutsForDay = allScheduledWorkouts.filter(w => w.date === dateStr && (this.selectedMemberId === 'all' || w.memberId == this.selectedMemberId));
            const lessonsForDay = allScheduledLessons.filter(l => l.date === dateStr);

            const dayEl = document.createElement('div');
            dayEl.classList.add('calendar-day');
            dayEl.dataset.date = dateStr;
            dayEl.setAttribute('role', 'gridcell');
            
            let ariaLabel = `${dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`;
            if (workoutsForDay.length > 0) ariaLabel += `, ${workoutsForDay.length} workout(s) scheduled.`;
            if (lessonsForDay.length > 0) ariaLabel += `, ${lessonsForDay.length} lesson(s) available.`;
            dayEl.setAttribute('aria-label', ariaLabel);

            dayEl.innerHTML = `<span>${day}</span>`;

            if (this.selectedDate && dayEl.dataset.date === this.selectedDate.toISOString().split('T')[0]) {
                dayEl.classList.add('selected');
            }

            if (workoutsForDay.length > 0) {
                const workoutList = document.createElement('ul');
                workoutList.className = 'calendar-workout-list';
                workoutsForDay.forEach(workout => {
                    const schema = this.app.dataStore.getWorkoutSchema(workout.schemaId);
                    const member = this.selectedMemberId === 'all' ? this.app.dataStore.getMemberById(workout.memberId) : null;

                    const listItem = document.createElement('li');
                    listItem.draggable = true;
                    listItem.className = 'calendar-workout-item'; // Base class

                    if (this.selectedMemberId === 'all') {
                        const memberName = member ? member.name.split(' ')[0] : '...';
                        listItem.textContent = `${memberName}: ${schema ? schema.name : 'Workout'}`;
                        listItem.title = `${member ? member.name : 'Unknown Member'} - ${schema ? schema.name : 'Workout'}`;
                    } else {
                        listItem.textContent = schema ? schema.name : 'Workout';
                    }

                    if (this.searchTerm && schema && schema.name.toLowerCase().includes(this.searchTerm.toLowerCase())) {
                        listItem.classList.add('highlighted-workout');
                    }
                    listItem.dataset.workoutId = workout.id;
                    workoutList.appendChild(listItem);
                });
                dayEl.appendChild(workoutList);
            }

            const filteredLessonsForDay = lessonsForDay.filter(l => {
                if (this.lessonCategoryFilter !== 'all') {
                    const template = this.app.dataStore.getLessonTemplateById(l.templateId);
                    return template && template.mainSection === this.lessonCategoryFilter;
                }
                return true;
            });


            if (lessonsForDay.length > 0) {
                const lessonList = document.createElement('ul');
                lessonList.className = 'calendar-lesson-list';
                lessonsForDay.forEach(lesson => {
                    const template = this.app.dataStore.getLessonTemplateById(lesson.templateId);
                    const listItem = document.createElement('li');
                    listItem.className = `calendar-lesson-item category-${template?.mainSection?.toLowerCase().replace(' ', '-') || 'default'}`;
                    listItem.textContent = template ? template.name : 'Class';
                    listItem.title = `Click to book: ${template.name}`;
                    listItem.dataset.lessonId = lesson.id;
                    lessonList.appendChild(listItem);
                });
                dayEl.appendChild(lessonList);
            }
            calendarGrid.appendChild(dayEl);
        }
    }

    addEventListeners(container) {
        container.querySelector('#prev-month-btn').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });
        container.querySelector('#next-month-btn').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });
        container.querySelector('#today-btn').addEventListener('click', () => {
            this.currentDate = new Date();
            this.selectedDate = new Date();
            this.renderWeeklyNotes();
            this.renderCalendar();
        });
        container.querySelector('#member-select').addEventListener('change', (e) => {
            this.selectedMemberId = e.target.value;
            const isGlobalView = this.selectedMemberId === 'all';
            container.querySelector('#copy-week-btn').disabled = isGlobalView;
            container.querySelector('#clear-week-btn').disabled = isGlobalView;
            container.querySelector('#weekly-notes-container').style.display = isGlobalView ? 'none' : 'block';
            this.renderWeeklyNotes();
            this.renderCalendar();
        });
        container.querySelector('#show-lessons-toggle').addEventListener('change', (e) => {
            this.showLessons = e.target.checked;
            container.querySelector('#lesson-category-filter').disabled = !this.showLessons;
            this.renderCalendar();
        });

        container.querySelector('#lesson-category-filter').addEventListener('change', (e) => {
            this.lessonCategoryFilter = e.target.value;
            this.renderCalendar();
        });

        container.querySelector('#copy-week-btn').addEventListener('click', () => this.toggleCopyMode());

        const searchInput = container.querySelector('#workout-search');
        const searchWrapper = container.querySelector('.search-wrapper');

        const debouncedSearch = debounce(() => {
            const newSearchTerm = searchInput.value;
            if (this.searchTerm !== newSearchTerm) {
                this.searchTerm = newSearchTerm;
                this.renderCalendar(); // Only re-render the calendar

                let clearBtn = searchWrapper.querySelector('#clear-search-btn');
                if (this.searchTerm && !clearBtn) {
                    const btn = document.createElement('button');
                    btn.id = 'clear-search-btn';
                    btn.className = 'btn-icon';
                    btn.title = 'Clear Search';
                    btn.innerHTML = '&times;';
                    btn.addEventListener('click', () => this.clearSearch(container));
                    searchWrapper.appendChild(btn);
                } else if (!this.searchTerm && clearBtn) {
                    clearBtn.remove();
                }
            }
        }, 300);
        searchInput.addEventListener('input', debouncedSearch);

        container.querySelector('#clear-week-btn').addEventListener('click', () => this.clearWeek());

        const calendarGrid = container.querySelector('#calendar-days');
        calendarGrid.addEventListener('keydown', (e) => this._handleKeyDown(e));

        calendarGrid.addEventListener('click', (e) => {
            // Priority 1: Handle lesson booking
            const lessonEl = e.target.closest('.calendar-lesson-item');
            if (lessonEl) {
                const lessonId = lessonEl.dataset.lessonId;

                if (this.selectedMemberId === 'all') {
                    this.app.uiManager.showNotification('Please select a specific member to book a lesson for.', 'warning');
                    return;
                }

                const memberId = this.selectedMemberId;
                this.app.router.navigate('#/book-lesson', { lessonId: lessonId, memberId: memberId });
                return; // Action handled, stop propagation.
            }

            // Priority 2: Handle workout quick view
            const workoutEl = e.target.closest('.calendar-workout-item');
            if (workoutEl) {
                const workoutId = workoutEl.dataset.workoutId;
                this._showQuickViewModal(workoutId);
                return;
            }

            // Priority 3: Handle empty day click
            const dayEl = e.target.closest('.calendar-day');
            if (!dayEl || dayEl.classList.contains('empty')) return;

            if (this.isCopyMode) {
                this.executeCopy(dayEl.dataset.date);
            } else {
                // Update selected date on any click
                this.selectedDate = new Date(dayEl.dataset.date);

                if (this.selectedMemberId === 'all') {
                    // In global view, just highlight the day.
                    this.renderCalendar();
                } else {
                    // In member view, update notes, calendar, and navigate.
                    this.renderWeeklyNotes();
                    this.renderCalendar(); // Re-render to show selection
                    this.app.router.navigate('#/assign-workout', { selectedDate: this.selectedDate, memberId: this.selectedMemberId });
                }
            }
        });

        // --- Drag and Drop Event Listeners ---
        calendarGrid.addEventListener('dragstart', e => {
            if (e.target.classList.contains('calendar-workout-item') && this.selectedMemberId !== 'all') {
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.workoutId);
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        calendarGrid.addEventListener('dragend', e => {
            if (e.target.classList.contains('calendar-workout-item')) {
                e.target.classList.remove('dragging');
            }
        });

        calendarGrid.addEventListener('dragover', e => {
            e.preventDefault(); // Necessary to allow dropping
            const dayEl = e.target.closest('.calendar-day');
            if (dayEl && !dayEl.classList.contains('empty')) {
                dayEl.classList.add('drag-over');
            }
        });

        calendarGrid.addEventListener('dragleave', e => {
            e.target.closest('.calendar-day')?.classList.remove('drag-over');
        });

        calendarGrid.addEventListener('drop', async (e) => {
            e.preventDefault();
            const dayEl = e.target.closest('.calendar-day');            
            if (!dayEl || dayEl.classList.contains('empty')) return;

            dayEl.classList.remove('drag-over');
            const workoutId = e.dataTransfer.getData('text/plain');
            const newDate = dayEl.dataset.date;
            const scheduledWorkouts = this.app.dataStore.getScheduledWorkouts();
            const workoutsOnTargetDay = scheduledWorkouts.filter(w => w.date === newDate && w.memberId == this.selectedMemberId);

            if (this.selectedMemberId === 'all') {
                this.app.uiManager.showNotification('Please select a specific member to reschedule workouts.', 'warning');
                return;
            }

            let canProceed = true;
            if (workoutsOnTargetDay.length > 0) {
                canProceed = await this.app.uiManager.showConfirmation(
                    'Reschedule Workout',
                    'This day already has a workout scheduled. Are you sure you want to add another one to this day?'
                );
            }

            if (canProceed && workoutId && newDate) {
                await this.app.dataStore.updateScheduledWorkout(workoutId, { date: newDate });
                this.app.uiManager.showNotification('Workout rescheduled successfully!', 'success');
                this.renderCalendar(); // Re-render to show the change
            } else if (!canProceed) {
                this.app.uiManager.showNotification('Reschedule cancelled.', 'info');
            }
        });
    }

    _handleKeyDown(e) {
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) return;
        e.preventDefault();

        const currentSelected = document.querySelector('.calendar-day.selected');
        if (!currentSelected) {
            // If nothing is selected, select the first day of the month
            const firstDay = document.querySelector('.calendar-day:not(.empty)');
            if (firstDay) {
                this.selectedDate = new Date(firstDay.dataset.date);
                this.renderCalendar();
                this.renderWeeklyNotes();
            }
            return;
        }

        const currentDate = new Date(currentSelected.dataset.date);
        let newDate;

        switch (e.key) {
            case 'ArrowUp': newDate = new Date(currentDate.setDate(currentDate.getDate() - 7)); break;
            case 'ArrowDown': newDate = new Date(currentDate.setDate(currentDate.getDate() + 7)); break;
            case 'ArrowLeft': newDate = new Date(currentDate.setDate(currentDate.getDate() - 1)); break;
            case 'ArrowRight': newDate = new Date(currentDate.setDate(currentDate.getDate() + 1)); break;
            case 'Enter':
                // Trigger the same action as a click
                currentSelected.click();
                return;
        }

        // Check if the new date is in a different month and navigate if needed
        if (newDate.getMonth() !== this.currentDate.getMonth()) {
            this.currentDate = new Date(newDate);
        }
        this.selectedDate = newDate;
        this.renderCalendar();
        this.renderWeeklyNotes();
    }

    _showQuickViewModal(workoutId) {
        const scheduledWorkout = this.app.dataStore.getScheduledWorkouts().find(w => w.id == workoutId);
        if (!scheduledWorkout) {
            this.app.uiManager.showNotification('Workout details not found.', 'error');
            return;
        }

        const schema = this.app.dataStore.getWorkoutSchema(scheduledWorkout.schemaId);
        const member = this.app.dataStore.getMemberById(scheduledWorkout.memberId);

        if (!schema || !member) {
            this.app.uiManager.showNotification('Could not load workout or member details.', 'error');
            return;
        }

        const title = `Workout Details: ${member.name}`;

        const renderBlockDetails = (block) => {
            switch (block.type) {
                case 'strength':
                    return `<span>${block.exercise}</span><strong>${block.sets} sets &times; ${block.reps} reps</strong>`;
                case 'cardio':
                    return `<span>${block.activity}</span><strong>${block.duration} min at ${block.intensity}</strong>`;
                case 'breath':
                    return `<span>${block.technique} Breathing</span><strong>${block.duration} seconds</strong>`;
                case 'rest':
                    return `<span>Rest</span><strong>${block.duration} seconds</strong>`;
                case 'questionnaire':
                    const q = this.app.dataStore.getQuestionnaires().find(q => q.id == block.questionnaireId);
                    return `<span>Questionnaire</span><strong>${q ? q.name : 'N/A'}</strong>`;
                default:
                    return `<span>Unknown Block Type</span><strong>-</strong>`;
            }
        };

        const bodyHtml = `
            <h4>${schema.name}</h4>
            <p class="note">${schema.description || 'No description.'}</p>
            <div class="detail-section">
                <h5>Workout Blocks</h5>
                <ul class="widget-list">${(schema.blocks || []).map(block => `<li>${renderBlockDetails(block)}</li>`).join('')}</ul>
                ${(schema.blocks || []).length === 0 ? '<p class="note">This schema has no blocks defined.</p>' : ''}
            </div>
        `;

        this.app.uiManager.showModal(title, bodyHtml);
    }

    clearSearch(container) {
        this.searchTerm = '';
        container.querySelector('#workout-search').value = '';
        container.querySelector('#clear-search-btn')?.remove();
        this.renderCalendar();
    }

    async clearWeek() {
        if (this.selectedMemberId === 'all') {
            this.app.uiManager.showNotification('Please select a member to clear their weekly schedule.', 'warning');
            return;
        }

        if (!this.selectedDate) {
            this.app.uiManager.showNotification('Please select a day in the week you want to clear.', 'warning');
            return;
        }

        const selected = new Date(this.selectedDate);
        const dayOfWeek = selected.getDay(); // 0=Sun, 1=Mon...
        const weekStart = new Date(new Date(selected).setDate(selected.getDate() - dayOfWeek));
        const weekEnd = new Date(new Date(weekStart).setDate(weekStart.getDate() + 6));

        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = weekEnd.toISOString().split('T')[0];

        const workoutsToClear = this.app.dataStore.getScheduledWorkouts().filter(w => {
            return w.memberId == this.selectedMemberId && w.date >= weekStartStr && w.date <= weekEndStr;
        });

        if (workoutsToClear.length === 0) {
            this.app.uiManager.showNotification('There are no workouts to clear in the selected week.', 'info');
            return;
        }

        const confirmed = await this.app.uiManager.showConfirmation(
            'Clear Week',
            `Are you sure you want to delete all ${workoutsToClear.length} workouts for this member in the selected week? This cannot be undone.`
        );

        if (confirmed) {
            const idsToDelete = workoutsToClear.map(w => w.id);
            await this.app.dataStore.deleteScheduledWorkouts(idsToDelete);
            this.app.uiManager.showNotification('Workouts for the week have been cleared.', 'success');
            this.renderCalendar();
        }
    }

    renderWeeklyNotes() {
        const notesContainer = document.getElementById('weekly-notes-container');
        if (!notesContainer) return;

        if (!this.selectedDate || !this.selectedMemberId || this.selectedMemberId === 'all') {
            notesContainer.innerHTML = '';
            notesContainer.style.display = 'none';
            return;
        }
        notesContainer.style.display = 'block';

        const [year, week] = this._getWeekNumber(this.selectedDate);
        const note = this.app.dataStore.getWeeklyNote(this.selectedMemberId, year, week);

        notesContainer.innerHTML = `
            <h3>Notes for Week ${week}, ${year}</h3>
            <div class="form-group">
                <textarea id="weekly-note-textarea" class="form-control" rows="4" placeholder="Add notes for this week...">${note}</textarea>
            </div>
        `;

        const textarea = notesContainer.querySelector('#weekly-note-textarea');
        const debouncedSave = debounce(async (value) => {
            await this.app.dataStore.saveWeeklyNote(this.selectedMemberId, year, week, value);
            this.app.uiManager.showNotification('Note saved!', 'success');
        }, 500);

        textarea.addEventListener('input', () => {
            debouncedSave(textarea.value);
        });
    }

    /**
     * Gets the ISO week number and year for a given date.
     * @param {Date} d - The date.
     * @returns {[number, number]} An array containing [year, weekNumber].
     */
    _getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return [d.getUTCFullYear(), weekNo];
    }

    toggleCopyMode() {
        const copyBtn = document.getElementById('copy-week-btn');
        if (this.selectedMemberId === 'all') {
            this.app.uiManager.showNotification('Please select a member to use the copy week feature.', 'warning');
            return;
        }


        if (this.isCopyMode) {
            // Cancel copy mode
            this.isCopyMode = false;
            this.sourceWeekStart = null;
            this.app.uiManager.showNotification('Copy week cancelled.', 'info');
            copyBtn.textContent = 'Copy Week';
            copyBtn.classList.remove('btn-danger');
            return;
        }

        if (!this.selectedDate) {
            this.app.uiManager.showNotification('Please select a day in the week you want to copy first.', 'warning');
            return;
        }

        this.isCopyMode = true;
        const sourceDate = new Date(this.selectedDate);
        const dayOfWeek = sourceDate.getDay(); // 0=Sun, 1=Mon...
        this.sourceWeekStart = new Date(sourceDate.setDate(sourceDate.getDate() - dayOfWeek));
        
        this.app.uiManager.showNotification('Copy mode activated. Click on any day in the target week to paste.', 'success');
        copyBtn.textContent = 'Cancel Copy';
        copyBtn.classList.add('btn-danger');
    }

    async executeCopy(targetDateStr) {
        const targetDate = new Date(targetDateStr);
        const targetDayOfWeek = targetDate.getDay();
        const targetWeekStart = new Date(targetDate.setDate(targetDate.getDate() - targetDayOfWeek));

        const sourceWorkouts = this.app.dataStore.getScheduledWorkouts().filter(w => {
            const workoutDate = new Date(w.date);
            const diffDays = (workoutDate - this.sourceWeekStart) / (1000 * 60 * 60 * 24);
            return w.memberId == this.selectedMemberId && diffDays >= 0 && diffDays < 7;
        });

        if (sourceWorkouts.length === 0) {
            this.app.uiManager.showNotification('Source week has no workouts to copy.', 'warning');
            this.toggleCopyMode(); // Exit copy mode
            return;
        }

        const newWorkouts = sourceWorkouts.map(workout => {
            const sourceWorkoutDate = new Date(workout.date);
            const dayOffset = sourceWorkoutDate.getDay();
            const newWorkoutDate = new Date(targetWeekStart);
            newWorkoutDate.setDate(newWorkoutDate.getDate() + dayOffset);

            return { memberId: workout.memberId, schemaId: workout.schemaId, date: newWorkoutDate.toISOString().split('T')[0] };
        });

        await Promise.all(newWorkouts.map(w => this.app.dataStore.addScheduledWorkout(w)));
        this.app.uiManager.showNotification(`${newWorkouts.length} workout(s) copied successfully!`, 'success');
        this.toggleCopyMode(); // Exit copy mode
        this.renderCalendar(); // Refresh the view
    }
}