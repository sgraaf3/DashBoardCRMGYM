import BaseListView from './baseListView.js';
import MemberModalView from './memberModalView.js';

class MemberListView extends BaseListView {
    _getEntityName() { return this.app.localizationService.t('crm.members.title'); }
    _getSingularEntityName() { return this.app.localizationService.t('crm.members.singular'); }
    _getFetchMethodName() { return 'getMembers'; }
    _getAddButtonId() { return 'add-member-btn'; }
    _getModalShowMethod() { return (app, onSave) => app.router.navigate('#/crm/members/add', { onSave }); }

    _renderList(items) {
        const listItems = items.map(item => `
            <li class="list-group-item">
                <a href="#/crm/members/${item.id}">${item.name}</a>
                <span class="status status-${(item.status || '').toLowerCase()}">${item.status || 'N/A'}</span>
                <div class="actions">
                    <button class="btn btn-sm btn-secondary edit-member-btn" data-id="${item.id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-member-btn" data-id="${item.id}">Delete</button>
                </div>
            </li>
        `).join('');

        return `
            <div class="widget">
                <div class="member-list-header">
                    <h3>${this._getEntityName()}</h3>
                    <button id="${this._getAddButtonId()}" class="btn btn-primary">${this.app.localizationService.t('crm.addmember')}</button>
                </div>
                <ul class="list-group">${listItems || `<li>No members found.</li>`}</ul>
            </div>
        `;
    }
    _setupEventListeners(container) {
        super._setupEventListeners(container); // Call parent's event listeners

        container.querySelectorAll('.edit-member-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const memberId = e.target.dataset.id;
                this.app.router.navigate(`#/crm/members/edit/${memberId}`);
            });
        });

        container.querySelectorAll('.delete-member-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const memberId = e.target.dataset.id;
                this._handleDeleteMember(memberId);
            });
        });
    }

    async _handleDeleteMember(memberId) {
        const member = this.app.dataStore.getMemberById(memberId);
        if (!member) return;

        const confirmed = await this.app.uiManager.showConfirmation(
            this.app.localizationService.t('confirm.delete.title'),
            this.app.localizationService.t('confirm.delete.message', { item: member.name })
        );

        if (confirmed) {
            await this.app.dataStore.deleteMember(memberId);
            this.app.uiManager.showNotification(this.app.localizationService.t('notification.deleted', { item: member.name }), 'success');
            this.render(this.container); // Re-render the list
        }
    }
}

export default MemberListView;