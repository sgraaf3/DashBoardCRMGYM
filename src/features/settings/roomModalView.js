import { formDataToObject } from '../../core/utils.js';

export default class RoomModalView {
    constructor(app) {
        this.app = app;
        this.dataStore = app.dataStore;
    }

    render(container, model) {
        const isEdit = !!model;
        const room = model || { name: '', capacity: 10 };

        container.innerHTML = `
            <form id="room-form">
                <input type="hidden" name="id" value="${room.id || ''}">
                <div class="form-group">
                    <label for="name">Room Name</label>
                    <input type="text" id="name" name="name" value="${room.name}" required>
                </div>
                <div class="form-group">
                    <label for="capacity">Capacity</label>
                    <input type="number" id="capacity" name="capacity" value="${room.capacity}" min="1" required>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Add Room'}</button>
                </div>
            </form>
        `;
        this.addEventListeners(isEdit);
    }

    addEventListeners(isEdit) {
        const form = document.getElementById('room-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const roomData = formDataToObject(formData);
            roomData.capacity = parseInt(roomData.capacity, 10);

            try {
                if (isEdit) {
                    await this.dataStore.updateRoom(roomData.id, roomData);
                    this.app.uiManager.showNotification('Room updated successfully!', 'success');
                } else {
                    await this.dataStore.addRoom(roomData);
                    this.app.uiManager.showNotification('Room added successfully!', 'success');
                }
                this.app.uiManager.hideModal();
                this.app.router.navigate('#/settings/rooms');
            } catch (error) {
                this.app.uiManager.showNotification(`Error: ${error.message}`, 'error');
            }
        });
    }
}