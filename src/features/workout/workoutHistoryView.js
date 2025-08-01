import GraphingComponent from '../../components/graphingComponent.js';

class WorkoutHistoryView {
    constructor(app) {
        this.app = app;
    }

    render(container, model = null) {
        const user = this.app.authManager.getCurrentUser();
        const logs = this.app.dataStore.getWorkoutLogsForUser(user.id);
        const schemas = this.app.dataStore.getWorkoutSchemas();

        const logItems = logs.map(log => {
            const schema = schemas.find(s => s.id === log.schemaId);
            const exercisesHtml = log.exercises.map(ex => `
                <li class="list-group-item-exercise">
                    <span>${ex.name}</span>
                    <span class="item-subtext">${ex.sets ? `${ex.sets} sets` : ''} ${ex.reps ? `x ${ex.reps} reps` : ''} ${ex.duration ? `${ex.duration}` : ''}</span>
                    <span class="exercise-status">${ex.completed ? 'Completed ✔️' : 'Not Completed ❌'}</span>
                    ${ex.notes ? `<p class="exercise-notes">Notes: ${ex.notes}</p>` : ''}
                </li>
            `).join('');

            return `
                <li class="list-group-item">
                    <div class="workout-log-header">
                        <span>${schema ? schema.name : 'Logged Workout'}</span>
                        <span class="item-subtext">${new Date(log.date).toLocaleDateString()}</span>
                    </div>
                    <ul class="list-group-exercises">
                        ${exercisesHtml}
                    </ul>
                </li>
            `;
        }).join('');

        container.innerHTML = `
            <div class="view-header"><h1>Workout History</h1></div>
            <div id="workout-history-graph" style="width: 100%; height: 300px; margin-bottom: 2rem;"></div>
            <div class="widget"><h3>Completed Sessions</h3><ul class="list-group">${logItems || '<li>No workouts logged yet.</li>'}</ul></div>
        `;

        if (logs.length > 1) {
            const graphData = logs.map((log, index) => ({ x: index, y: (log.schemaId * 10) + (Math.random() * 20), label: new Date(log.date).toLocaleDateString() }));
            const graph = new GraphingComponent('workout-history-graph');
            graph.render(graphData, { pointRadius: 5 });
        }
    }
}

export default WorkoutHistoryView;