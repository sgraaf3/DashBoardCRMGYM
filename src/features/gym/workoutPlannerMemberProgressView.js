export default class WorkoutPlannerMemberProgressView {
    constructor(app) {
        this.app = app;
    }

    render(container, model = null) {
        const members = this.app.dataStore.getMembers();

        container.innerHTML = `
            <div class="view-header">
                <h1>Workout Planner Member Progress</h1>
            </div>
            <div class="widget">
                <h2>Select a Member to View Progress</h2>
                <ul class="list-group">
                    ${members.length > 0 ? members.map(member => `
                        <li class="list-group-item">
                            <a href="#/workout-planner-member-progress/detail/${member.id}">${member.name}</a>
                        </li>
                    `).join('') : '<li>No members found.</li>'}
                </ul>
            </div>
        `;
    }
}
