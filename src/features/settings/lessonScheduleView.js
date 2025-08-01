export default class LessonScheduleView {
    constructor(app) {
        this.app = app;
        this.dataStore = app.dataStore;
    }

    render(container) {
        const lessonTemplates = this.dataStore.getLessonTemplates();
        const employees = this.dataStore.getEmployees();
        const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        container.innerHTML = `
            <div class="view-header">
                <h1>Lesson Schedule Management</h1>
                <a href="#/settings/lessons/add" class="btn btn-primary">Add New Lesson</a>
            </div>
            <div class="widget">
                <table class="activity-table">
                    <thead>
                        <tr>
                            <th>Lesson Name</th>
                            <th>Category</th>
                            <th>Trainer</th>
                            <th>Time</th>
                            <th>Day</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lessonTemplates.map(lesson => {
                            const trainer = employees.find(e => e.id === lesson.trainerId);
                            return `
                                <tr>
                                    <td>${lesson.name}</td>
                                    <td>${lesson.mainSection}</td>
                                    <td>${trainer ? trainer.name : 'N/A'}</td>
                                    <td>${lesson.time}</td>
                                    <td>${daysMap[lesson.dayOfWeek] || 'N/A'}</td>
                                    <td class="actions">
                                        <a href="#/settings/lessons/edit/${lesson.id}" class="btn-icon" title="Edit">&#9998;</a>
                                        <button class="btn-icon" data-action="delete-lesson" data-lesson-id="${lesson.id}" title="Delete">&#128465;</button>
                                    </td>
                                </tr>
                            `}).join('')}
                        ${lessonTemplates.length === 0 ? '<tr><td colspan="6">No recurring lessons have been added yet.</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        `;
        this.addEventListeners(container);
    }

    addEventListeners(container) {
        container.addEventListener('click', e => {
            if (e.target.dataset.action === 'delete-lesson') {
                const lessonId = e.target.dataset.lessonId;
                this.app.uiManager.showConfirmation('Delete Lesson', 'Are you sure you want to delete this recurring lesson template?')
                    .then(confirmed => {
                        if (confirmed) {
                            this.dataStore.deleteLessonTemplate(lessonId).then(() => {
                                this.app.uiManager.showNotification('Lesson template deleted.', 'success');
                                this.render(container);
                            });
                        }
                    });
            }
        });
    }
}