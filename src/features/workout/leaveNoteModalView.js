export default class LeaveNoteModalView {
    constructor(app) {
        this.app = app;
    }

    render(container, workoutLog) {
        if (!workoutLog) {
            container.innerHTML = `<p class="text-danger">Workout log not found.</p>`;
            return;
        }

        const member = this.app.dataStore.getMemberById(workoutLog.userId);
        const schema = this.app.dataStore.getWorkoutSchema(workoutLog.schemaId);

        container.innerHTML = `
            <form id="leave-note-form">
                <p>Adding a note for <strong>${member?.name || 'Unknown Member'}</strong>'s workout on ${new Date(workoutLog.date).toLocaleDateString()}.</p>
                <p><strong>Workout:</strong> ${schema?.name || 'Custom Workout'}</p>
                <div class="form-group">
                    <label for="workout-note">Coach's Note</label>
                    <textarea id="workout-note" class="form-control" rows="5" placeholder="Enter your observations, feedback, or notes for the next session...">${workoutLog.coachNotes || ''}</textarea>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">Save Note</button>
                </div>
            </form>
        `;

        this.addEventListeners(container, workoutLog.id);
    }

    addEventListeners(container, logId) {
        const form = container.querySelector('#leave-note-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const note = container.querySelector('#workout-note').value;
            await this.app.dataStore.updateWorkoutLog(logId, { coachNotes: note });
            this.app.uiManager.showNotification('Note saved successfully!', 'success');
            this.app.uiManager.hideModal();
        });
    }
}