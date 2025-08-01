class WorkoutPlannerView {
    constructor(app) {
        this.app = app;
    }

    render(container) {
        container.innerHTML = `
            <div class="sub-view-header">
                <h2>Workout Planner</h2>
                <p>Assign and manage workout plans for your members.</p>
            </div>
            <div class="sub-view-body"><p>Feature coming soon.</p></div>
        `;
    }
}

export default WorkoutPlannerView;