export default class AssignWorkoutModalView {
    constructor(app) {
        this.app = app;
    }

    render(container, _model, routeData) {
        if (routeData && routeData.lessonId) {
            // Mode: Book Lesson
            this.renderBookingView(container, routeData);
        } else if (routeData && routeData.selectedDate && routeData.memberId) {
            // Mode: Assign Workout
            this.renderAssignWorkoutView(container, routeData);
        } else {
            container.innerHTML = `<p class="text-danger">Invalid modal parameters. A member must be selected in the planner.</p>`;
            this.app.uiManager.showNotification('Could not open modal due to missing data.', 'error');
        }
    }

    // --- Booking Lesson Logic ---
    renderBookingView(container, routeData) {
        const { lessonId, memberId } = routeData;
        const lesson = this.app.dataStore.getScheduledLessonById(lessonId);
        const member = this.app.dataStore.getMemberById(memberId);
        const template = lesson ? this.app.dataStore.getLessonTemplateById(lesson.templateId) : null;

        if (!lesson || !member || !template) {
            container.innerHTML = `<p class="text-danger">Error: Could not find the requested lesson or member.</p>`;
            return;
        }

        const isAlreadyBooked = lesson.attendees.includes(memberId);
        const isFull = lesson.attendees.length >= (template.maxCapacity || 999);

        container.innerHTML = `
            <div class="booking-details">
                <h4>${template.name}</h4>
                <p><strong>Date:</strong> ${new Date(lesson.date).toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Time:</strong> ${lesson.time}</p>
                <p><strong>Spots Available:</strong> ${(template.maxCapacity || '∞') - lesson.attendees.length} / ${template.maxCapacity || '∞'}</p>
                <hr>
                <p>You are booking this lesson for:</p>
                <p class="font-bold text-lg">${member.name}</p>
            </div>
            <div class="modal-actions">
                ${isAlreadyBooked
                    ? `<p class="text-success">This member is already booked.</p><button id="cancel-booking-btn" class="btn btn-danger">Cancel Booking</button>`
                    : isFull
                        ? `<p class="text-warning">This lesson is full.</p>`
                        : `<button id="confirm-booking-btn" class="btn btn-primary">Confirm Booking</button>`
                }
            </div>
        `;
        this.addBookingEventListeners(container, lessonId, memberId);
    }

    addBookingEventListeners(container, lessonId, memberId) {
        container.querySelector('#confirm-booking-btn')?.addEventListener('click', async () => {
            await this.app.dataStore.addAttendeeToLesson(lessonId, memberId);
            this.app.uiManager.showNotification('Lesson booked successfully!', 'success');
            this.app.uiManager.hideModal();
            this.app.router.refreshCurrentView();
        });

        container.querySelector('#cancel-booking-btn')?.addEventListener('click', async () => {
            await this.app.dataStore.removeAttendeeFromLesson(lessonId, memberId);
            this.app.uiManager.showNotification('Booking cancelled.', 'info');
            this.app.uiManager.hideModal();
            this.app.router.refreshCurrentView();
        });
    }

    // --- Assign Workout Logic ---
    renderAssignWorkoutView(container, routeData) {
        const { selectedDate, memberId } = routeData;
        const member = this.app.dataStore.getMemberById(memberId);

        if (!memberId || memberId === 'all' || !member) {
            container.innerHTML = `<p class="text-danger">No member selected in the planner. Please close this and select a member first.</p>`;
            return;
        }

        const schemas = this.app.dataStore.getWorkoutSchemas();
        const schemaOptions = schemas.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

        container.innerHTML = `
            <p>Assigning workout for <strong>${member.name}</strong> on <strong>${new Date(selectedDate).toLocaleDateString()}</strong>.</p>
            <form id="assign-workout-form">
                <div class="form-group">
                    <label for="schema-select">Select Workout Plan</label>
                    <select id="schema-select" name="schemaId" class="form-control" required><option value="">-- Choose a plan --</option>${schemaOptions}</select>
                </div>
                <div class="modal-actions"><button type="submit" class="btn btn-primary">Assign Workout</button></div>
            </form>
        `;
        this.addAssignWorkoutEventListeners(container, memberId, new Date(selectedDate).toISOString().split('T')[0]);
    }

    addAssignWorkoutEventListeners(container, memberId, date) {
        const form = container.querySelector('#assign-workout-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const schemaId = form.querySelector('#schema-select').value;
            if (!schemaId) { this.app.uiManager.showNotification('Please select a workout plan.', 'warning'); return; }
            await this.app.dataStore.addScheduledWorkout({ memberId, schemaId, date });
            this.app.uiManager.showNotification('Workout assigned successfully!', 'success');
            this.app.uiManager.hideModal();
            this.app.router.refreshCurrentView();
        });
    }
}
