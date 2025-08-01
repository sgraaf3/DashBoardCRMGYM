import GraphingComponent from '../../components/graphingComponent.js';

export default class MemberProgressDetailView {
    constructor(app) {
        this.app = app;
        this.chartInstances = {};
    }

    destroy() {
        Object.values(this.chartInstances).forEach(chart => chart.destroy());
    }

    render(container, model = null, memberId) {
        this.destroy();
        const member = this.app.dataStore.getMemberById(memberId);
        if (!member) {
            container.innerHTML = `<h2>Member Not Found</h2><p>No member found with ID: ${memberId}</p>`;
            return;
        }

        const workoutLogs = this.app.dataStore.getWorkoutLogsForUser(member.id);
        const schemas = this.app.dataStore.getWorkoutSchemas();

        const logItemsHtml = workoutLogs.map(log => {
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
            <div class="view-header">
                <h1>Progress for ${member.name}</h1>
                <a href="#/workout-planner-member-progress" class="btn">Back to Members</a>
            </div>
            <div class="widget">
                <h2>Workout History</h2>
                <div id="member-progress-graph" style="width: 100%; height: 300px; margin-bottom: 2rem;"></div>
                <ul class="list-group">
                    ${logItemsHtml || '<li>No workouts logged for this member yet.</li>'}
                </ul>
            </div>
        `;

        if (workoutLogs.length > 1) {
            const graphData = workoutLogs.map((log, index) => ({
                x: index,
                y: log.exercises.filter(ex => ex.completed).length, // Example: count completed exercises
                label: new Date(log.date).toLocaleDateString()
            }));
            const graph = new GraphingComponent('member-progress-graph');
            graph.render(graphData, { pointRadius: 5, label: 'Completed Exercises' });
        }
    }
}
