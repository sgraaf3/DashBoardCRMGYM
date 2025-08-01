import BaseDetailView from './baseDetailView.js';
import EmployeeModalView from './employeeModalView.js';

class EmployeeDetailView extends BaseDetailView {
    _getSingularEntityName() { return this.app.localizationService.t('crm.employees.singular'); }
    _getFetchMethodName() { return 'getEmployeeById'; }
    _getEditButtonId() { return 'edit-employee-btn'; }
    _getDeleteButtonId() { return 'delete-employee-btn'; }
    _getDeleteMethodName() { return 'deleteEmployee'; }
    _getModalShowMethod() { return (app, employee, onSave) => app.router.navigate('#/crm/employees/edit', { employee, onSave }); }

    _renderContent(employee) {
        return `
            <div class="view-header">
                <h2>${employee.name}</h2>
                <div>
                    <button id="${this._getEditButtonId()}" class="btn">${this.app.localizationService.t('crm.employees.edit')}</button>
                    <button id="${this._getDeleteButtonId()}" class="btn btn-danger">${this.app.localizationService.t('modal.button.delete')}</button>
                </div>
            </div>
            <a href="#/crm" class="back-link">&larr; ${this.app.localizationService.t('crm.backToList')}</a>
            <div class="widget member-detail-card">
                <p><strong>Role:</strong> ${employee.role}</p>
                <p><strong>Specialty:</strong> ${employee.specialty}</p>
            </div>
        `;
    }
}

export default EmployeeDetailView;