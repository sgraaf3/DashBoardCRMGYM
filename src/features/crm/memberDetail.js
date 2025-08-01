

/**
 * @class memberDetail
 * @description Renders the detailed view for a single member.
 */
export default class memberDetail extends baseDetailView {
    _getEntityName() {
        return LocalizationService.t('crm.members.title');
    }
    _getSingularEntityName() {
        return LocalizationService.t('crm.members.singular');
    }
    _getFetchMethodName() {
        return 'getmemberById';
    }
    _getEditButtonId() {
        return 'edit-member-btn';
    }
    _getModalShowMethod() {
        return showmemberModal;
    }
    _getDeleteMethodName() {
        return 'deletemember';
    }
    _renderContent(member) {
        return `
            <div class="view-header">
                <h2>${member.name}</h2>
                <div class="header-actions">
                    <button id="edit-member-btn" class="btn">${LocalizationService.t('crm.members.edit')}</button>
                    <button id="${this._getDeleteButtonId()}" class="btn btn-danger">${LocalizationService.t('modal.button.delete')}</button>
                </div>
            </div>
            <a href="#/crm" class="back-link">&larr; ${LocalizationService.t('crm.backToList')}</a>
            <div class="widget member-detail-card">
                <div class="detail-section">
                    <h4>Contact Information</h4>
                    <p><strong>Email:</strong> ${member.email || 'N/A'}</p>
                </div>
                <div class="detail-section">
                    <h4>Membership Details</h4>
                    <p><strong>Plan:</strong> ${member.membership?.plan || 'N/A'}</p>
                    <p><strong>Join Date:</strong> ${member.joinDate ? new Date(member.joinDate).toLocaleDateString() : 'N/A'}</p>
                </div>
            </div>
        `;
    }
}