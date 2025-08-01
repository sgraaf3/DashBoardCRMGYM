import BaseListView from './baseListView.js';
import EmployeeModalView from './employeeModalView.js';

class EmployeeListView extends BaseListView {
    _getEntityName() { return this.app.localizationService.t('crm.employees.title'); }
    _getSingularEntityName() { return this.app.localizationService.t('crm.employees.singular'); }
    _getFetchMethodName() { return 'getEmployees'; }
    _getAddButtonId() { return 'add-employee-btn'; }
    _getModalShowMethod() { return (app, onSave) => app.router.navigate('#/crm/employees/add', { onSave }); }

    _renderList(items) {
        const listItems = items.map(item => `
            <li class="list-group-item">
                <a href="#/crm/employees/${item.id}">${item.name}</a>
                <span class="item-subtext">${item.role}</span>
                <div class="actions">
                    <button class="btn btn-sm btn-secondary edit-employee-btn" data-id="${item.id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-employee-btn" data-id="${item.id}">Delete</button>
                </div>
            </li>
        `).join('');

        return `
            <div class="widget">
                <div class="member-list-header">
                    <h3>${this._getEntityName()}</h3>
                    <button id="${this._getAddButtonId()}" class="btn btn-primary">${this.app.localizationService.t('crm.employees.addEmployee')}</button>
                </div>
                <ul class="list-group">${listItems || `<li>No employees found.</li>`}</ul>
            </div>
        `;
    }
    _setupEventListeners(container) {
        super._setupEventListeners(container); // Call parent's event listeners

        container.querySelectorAll('.edit-employee-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const employeeId = e.target.dataset.id;
                this.app.router.navigate(`#/crm/employees/edit/${employeeId}`);
            });
        });

        container.querySelectorAll('.delete-employee-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const employeeId = e.target.dataset.id;
                this._handleDeleteEmployee(employeeId);
            });
        });
    }

    async _handleDeleteEmployee(employeeId) {
        const employee = this.app.dataStore.getEmployeeById(employeeId);
        if (!employee) return;

        const confirmed = await this.app.uiManager.showConfirmation(
            this.app.localizationService.t('confirm.delete.title'),
            this.app.localizationService.t('confirm.delete.message', { item: employee.name })
        );

        if (confirmed) {
            await this.app.dataStore.deleteEmployee(employeeId);
            this.app.uiManager.showNotification(this.app.localizationService.t('notification.deleted', { item: employee.name }), 'success');
            this.render(this.container); // Re-render the list
        }
    }
}

export default EmployeeListView;