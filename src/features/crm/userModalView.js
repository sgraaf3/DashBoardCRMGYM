class UserModalView {
    constructor(app) {
        this.app = app;
    }

    render(container, user, onSave) {
        const isEditing = !!user;
        const title = isEditing ? this.app.localizationService.t('crm.users.edit') : this.app.localizationService.t('crm.adduser');
        const roles = ['admin', 'member', 'employee'];

        container.innerHTML = `
            <div class="view-header">
                <h2>${title}</h2>
            </div>
            <form id="user-form" class="modal-form">
                <div class="form-group"><label for="u-name">Name</label><input id="u-name" value="${user?.name || ''}" required></div>
                <div class="form-group"><label for="u-username">Username (Email)</label><input id="u-username" type="email" value="${user?.username || ''}" required></div>
                <div class="form-group"><label for="u-password">Password</label><input id="u-password" type="password" value="${user?.password || ''}" ${isEditing ? '' : 'required'}></div>
                <div class="form-group"><label for="u-role">Role</label><select id="u-role">${roles.map(r => `<option value="${r}" ${user?.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
                <div class="modal-actions"><button type="submit" class="btn btn-primary">Save</button></div>
            </form>
        `;
        this.addEventListeners(container, user, onSave);
    }

    addEventListeners(container, user, onSave) {
        container.querySelector('#user-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const userData = {
                name: document.getElementById('u-name').value,
                username: document.getElementById('u-username').value,
                password: document.getElementById('u-password').value,
                role: document.getElementById('u-role').value
            };

            // Only update password if it's provided (i.e., not empty in edit mode)
            if (user && !userData.password) {
                delete userData.password;
            }

            const isEditing = !!user;
            if (isEditing) {
                await this.app.dataStore.updateUser(user.id, userData);
            } else {
                await this.app.dataStore.addUser(userData);
            }
            
            this.app.uiManager.showNotification('User saved successfully!', 'success');
            if (onSave) onSave();
            window.history.back(); // Go back to the previous view (e.g., user list)
        });
    }
}

export default UserModalView;