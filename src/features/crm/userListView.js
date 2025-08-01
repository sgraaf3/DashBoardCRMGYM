import BaseListView from './baseListView.js';

class UserListView extends BaseListView {
    _getEntityName() { return this.app.localizationService.t('crm.users.title'); }
    _getSingularEntityName() { return this.app.localizationService.t('crm.users.singular'); }
    _getFetchMethodName() { return 'getUsers'; }
    _getAddButtonId() { return 'add-user-btn'; }
    _getModalShowMethod() { return (app, onSave) => app.router.navigate('#/crm/users/add', { onSave }); }

    _renderList(items) {
        const listItems = items.map(item => `
            <li class="list-group-item">
                <a href="#/crm/users/${item.id}">${item.name} (${item.username})</a>
                <span class="status status-${(item.role || '').toLowerCase()}">${item.role || 'N/A'}</span>
                <div class="actions">
                    <button class="btn btn-sm btn-secondary edit-user-btn" data-id="${item.id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-user-btn" data-id="${item.id}">Delete</button>
                </div>
            </li>
        `).join('');

        return `
            <div class="widget">
                <div class="user-list-header">
                    <h3>${this._getEntityName()}</h3>
                    <button id="${this._getAddButtonId()}" class="btn btn-primary">${this.app.localizationService.t('crm.adduser')}</button>
                </div>
                <ul class="list-group">${listItems || `<li>No users found.</li>`}</ul>
            </div>
        `;
    }

    _setupEventListeners(container) {
        super._setupEventListeners(container); // Call parent's event listeners

        container.querySelectorAll('.edit-user-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const userId = e.target.dataset.id;
                this.app.router.navigate(`#/crm/users/edit/${userId}`);
            });
        });

        container.querySelectorAll('.delete-user-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const userId = e.target.dataset.id;
                this._handleDeleteUser(userId);
            });
        });
    }

    async _handleDeleteUser(userId) {
        const user = this.app.dataStore.getUserById(userId);
        if (!user) return;

        const confirmed = await this.app.uiManager.showConfirmation(
            this.app.localizationService.t('confirm.delete.title'),
            this.app.localizationService.t('confirm.delete.message', { item: user.name })
        );

        if (confirmed) {
            await this.app.dataStore.deleteUser(userId);
            this.app.uiManager.showNotification(this.app.localizationService.t('notification.deleted', { item: user.name }), 'success');
            this.render(this.container); // Re-render the list
        }
    }
}

export default UserListView;