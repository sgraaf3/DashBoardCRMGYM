import BaseDetailView from './baseDetailView.js';
import MemberModalView from './memberModalView.js';

class MemberDetailView extends BaseDetailView {
    _getSingularEntityName() { return this.app.localizationService.t('crm.members.singular'); }
    _getFetchMethodName() { return 'getMemberById'; }
    _getEditButtonId() { return 'edit-member-btn'; }
    _getDeleteButtonId() { return 'delete-member-btn'; }
    _getDeleteMethodName() { return 'deleteMember'; }
    _getModalShowMethod() { return (app, member, onSave) => app.router.navigate('#/crm/members/edit', { member, onSave }); }

    _renderContent(member) {
        return `
            <div class="view-header">
                <h2>${member.name}</h2>
                <div>
                    <button id="${this._getEditButtonId()}" class="btn">${this.app.localizationService.t('crm.members.edit')}</button>
                    <button id="${this._getDeleteButtonId()}" class="btn btn-danger">${this.app.localizationService.t('modal.button.delete')}</button>
                </div>
            </div>
            <a href="#/crm" class="back-link">&larr; ${this.app.localizationService.t('crm.backToList')}</a>
            <div class="widget member-detail-card">
                <p><strong>Email:</strong> ${member.email}</p>
                <p><strong>Status:</strong> ${member.status}</p>
                <p><strong>Plan:</strong> ${member.membership.plan}</p>
                <p><strong>Join Date:</strong> ${new Date(member.joinDate).toLocaleDateString()}</p>
            </div>
        `;
    }
}

export default MemberDetailView;