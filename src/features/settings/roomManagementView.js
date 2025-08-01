export default class RoomManagementView {
    constructor(app) {
        this.app = app;
        this.dataStore = app.dataStore;
    }

    render(container, model = null) {
        const rooms = this.dataStore.getRooms();
        container.innerHTML = `
            <div class="view-header">
                <h1>Room Management</h1>
                <a href="#/settings/rooms/add" class="btn btn-primary">Add New Room</a>
            </div>
            <div class="widget">
                <table class="activity-table">
                    <thead>
                        <tr>
                            <th>Room Name</th>
                            <th>Capacity</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rooms.map(room => `
                            <tr>
                                <td>${room.name}</td>
                                <td>${room.capacity}</td>
                                <td class="actions">
                                    <a href="#/settings/rooms/edit/${room.id}" class="btn-icon" title="Edit">&#9998;</a>
                                    <button class="btn-icon" data-action="delete-room" data-room-id="${room.id}" title="Delete">&#128465;</button>
                                </td>
                            </tr>
                        `).join('')}
                        ${rooms.length === 0 ? '<tr><td colspan="3">No rooms have been added yet.</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        `;
        this.addEventListeners(container);
    }

    addEventListeners(container) {
        container.addEventListener('click', e => {
            const action = e.target.dataset.action;
            if (action === 'delete-room') {
                const roomId = e.target.dataset.roomId;
                this.app.uiManager.showConfirmation('Delete Room', 'Are you sure you want to delete this room?')
                    .then(confirmed => {
                        if (confirmed) {
                            this.dataStore.deleteRoom(roomId).then(() => {
                                this.app.uiManager.showNotification('Room deleted.', 'success');
                                this.render(container); // Re-render the view
                            });
                        }
                    });
            }
        });
    }

    destroy() {
        // Cleanup
    }
}