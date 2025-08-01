import BaseListView from '../../core/baseListView.js';
import MemberModalView from './memberModalView.js';

export default class MemberManagementWidget extends BaseListView {
    constructor(app) {
        super(app);
        this.app = app;
    }

    _getEntityName() { return this.app.localizationService.t('crm.members.title'); }
    _getSingularEntityName() { return this.app.localizationService.t('crm.members.singular'); }
    _getFetchMethodName() { return 'getMembers'; }
    _getAddButtonId() { return 'add-member-btn'; }
    _getModalShowMethod() { return (app, onSave) => app.router.navigate('#/crm/members/add', { onSave }); }

    async render(container) {
        await super.render(container);
        // Additional rendering specific to the widget if needed
    }

    _renderListItems(items) {
        if (!items || items.length === 0) {
            return '<li>No members found.</li>';
        }
        return items.map(item => `
            <li class="list-group-item">
                <a href="#/crm/members/${item.id}">${item.name}</a>
                <span>${item.email}</span>
                <div class="item-actions">
                    <button class="btn btn-sm btn-secondary edit-member-btn" data-id="${item.id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-member-btn" data-id="${item.id}">Delete</button>
                </div>
            </li>
        `).join('');
    }

    _addSpecificEventListeners(container) {
        // Event listeners for edit and delete buttons
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
            this.render(this.container); // Re-render the list after deletion
        }
    }
}
