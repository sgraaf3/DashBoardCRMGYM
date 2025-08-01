

export default class employeeDetail extends baseDetailView {
    _getEntityName() {
        return LocalizationService.t('crm.employees.title');
    }
    _getSingularEntityName() {
        return LocalizationService.t('crm.employees.singular');
    }
    _getFetchMethodName() {
        return 'getemployeeById';
    }
    _getEditButtonId() {
        return 'edit-employee-btn';
    }
    _getModalShowMethod() {
        return showemployeeModal;
    }
    _getDeleteMethodName() {
        return 'deleteemployee';
    }
    _renderContent(employee) {
        return `
            <div class="view-header">
                <h2>${employee.name}</h2>
                <div class="header-actions">
                    <button id="edit-employee-btn" class="btn">${LocalizationService.t('crm.employees.edit')}</button>
                    <button id="${this._getDeleteButtonId()}" class="btn btn-danger">${LocalizationService.t('modal.button.delete')}</button>
                </div>
            </div>
            <a href="#/crm" class="back-link">&larr; ${LocalizationService.t('crm.backToList')}</a>
            <div class="widget">
                <p><strong>Role:</strong> ${employee.role}</p>
                <p><strong>Specialty:</strong> ${employee.specialty || 'N/A'}</p>
            </div>
        `;
    }
}