import { formDataToObject } from '../../core/utils.js';

export default class LessonModalView {
    constructor(app) {
        this.app = app;
        this.dataStore = app.dataStore;
    }

    render(container, model) {
        const isEdit = !!model;
        const lesson = model || { days: [] };
        const employees = this.dataStore.getEmployees().filter(e => e.role === 'Coach');
        const rooms = this.dataStore.getRooms();
        const mainSections = ['Fitness', 'Budo', 'Dance', 'Swimming', 'Yoga', 'Strength'];
        const daysOfWeek = [
            { value: 0, name: 'Sunday' }, { value: 1, name: 'Monday' }, { value: 2, name: 'Tuesday' },
            { value: 3, name: 'Wednesday' }, { value: 4, name: 'Thursday' }, { value: 5, name: 'Friday' }, { value: 6, name: 'Saturday' }
        ];

        container.innerHTML = `
            <form id="lesson-form">
                <input type="hidden" name="id" value="${lesson.id || ''}">
                <div class="form-group">
                    <label for="mainSection">Main Section</label>
                    <select id="mainSection" name="mainSection" required>
                        ${mainSections.map(s => `<option value="${s}" ${lesson.mainSection === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="name">Lesson Name</label>
                    <input type="text" id="name" name="name" value="${lesson.name || ''}" required>
                </div>
                <div class="form-group">
                    <label for="description">Description / Lesson Plan</label>
                    <textarea id="description" name="description" rows="4">${lesson.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="trainerId">Trainer/Coach</label>
                    <select id="trainerId" name="trainerId" required>
                        <option value="">Select a trainer</option>
                        ${employees.map(e => `<option value="${e.id}" ${lesson.trainerId === e.id ? 'selected' : ''}>${e.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="roomId">Room</label>
                    <select id="roomId" name="roomId" required>
                        <option value="">Select a room</option>
                        ${rooms.map(r => `<option value="${r.id}" ${lesson.roomId === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="time">Time</label>
                    <input type="time" id="time" name="time" value="${lesson.time || '19:00'}" required>
                </div>
                <div class="form-group">
                    <label for="dayOfWeek">Day of the Week</label>
                    <select id="dayOfWeek" name="dayOfWeek" class="form-control" required>
                        <option value="">Select a day</option>
                        ${daysOfWeek.map(day => `<option value="${day.value}" ${lesson.dayOfWeek == day.value ? 'selected' : ''}>${day.name}</option>`).join('')}
                    </select>
                </div>

                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Add Lesson'}</button>
                </div>
            </form>
        `;
        this.addEventListeners(isEdit);
    }

    addEventListeners(isEdit) {
        const form = document.getElementById('lesson-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const lessonData = formDataToObject(formData);
            
            if (lessonData.dayOfWeek === '') {
                this.app.uiManager.showNotification('Please select a day of the week.', 'error');
                return;
            }
            lessonData.dayOfWeek = parseInt(lessonData.dayOfWeek, 10);

            try {
                if (isEdit) {
                    // If editing, update the lesson template
                    await this.dataStore.updateLessonTemplate(lessonData.id, lessonData);
                    // Also update the linked schema's name and description to keep them in sync
                    if (model && model.schemaId) {
                        await this.dataStore.saveWorkoutSchema({ id: model.schemaId, name: lessonData.name, description: lessonData.description });
                    }
                    this.app.uiManager.showNotification('Lesson updated successfully!', 'success');
                } else {
                    // If creating, first create a corresponding workout schema
                    const newSchema = await this.dataStore.saveWorkoutSchema({
                        name: lessonData.name,
                        description: lessonData.description,
                        exercises: [] // Can be edited later via schema builder
                    });
                    lessonData.schemaId = newSchema.id; // Link schema to the lesson
                    await this.dataStore.addLessonTemplate(lessonData);
                    this.app.uiManager.showNotification('Lesson added successfully!', 'success');
                }
                this.app.uiManager.hideModal();
                this.app.router.navigate('#/settings/lessons');
            } catch (error) {
                this.app.uiManager.showNotification(`Error: ${error.message}`, 'error');
            }
        });
    }
}