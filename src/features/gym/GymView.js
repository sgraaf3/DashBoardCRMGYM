export default class GymView {
    constructor(app) {
        this.app = app;
        this.dataStore = app.dataStore;
    }

    render(container, model) {
        const schemas = this.dataStore.getWorkoutSchemas();
        const rooms = this.dataStore.getRooms();

        container.innerHTML = `
            <div class="view-header">
                <h1>Gym & Facility Management</h1>
            </div>

            <div class="tools-grid">
                <div class="tool-card">
                    <h3>Workout Schemas</h3>
                    <p>Create and manage reusable workout templates for members.</p>
                    <p><strong>Total Schemas:</strong> ${schemas.length}</p>
                    <div class="widget-actions">
                        <a href="#/gym/schemas/add" class="btn btn-primary">Create New Schema</a>
                    </div>
                </div>

                <div class="tool-card">
                    <h3>Room Management</h3>
                    <p>Manage gym rooms, capacity, and equipment.</p>
                    <p><strong>Total Rooms:</strong> ${rooms.length}</p>
                    <div class="widget-actions">
                        <a href="#/settings/rooms" class="btn">Manage Rooms</a>
                    </div>
                </div>
            </div>
        `;
    }

    destroy() {
        // Cleanup if needed
    }
}