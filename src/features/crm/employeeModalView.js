class EmployeeModalView {
    constructor(app) {
        this.app = app;
    }

    render(container, employee, onSave) {
        const isEditing = !!employee;
        const title = isEditing ? this.app.localizationService.t('crm.employees.edit') : this.app.localizationService.t('crm.employees.addEmployee');
        const roles = ['Coach', 'Admin'];

        container.innerHTML = `
            <div class="view-header">
                <h2>${title}</h2>
            </div>
            <form id="employee-form" class="modal-form">
                <div class="form-group"><label for="e-name">Name</label><input id="e-name" value="${employee?.name || ''}" required></div>
                <div class="form-group"><label for="e-email">Email (for login)</label><input id="e-email" type="email" value="${employee?.email || ''}" required></div>
                <div class="form-group"><label for="e-role">Role</label><select id="e-role">${roles.map(r => `<option value="${r}" ${employee?.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
                <div class="form-group"><label for="e-specialty">Specialty</label><input id="e-specialty" value="${employee?.specialty || ''}"></div>
                <div class="modal-actions"><button type="submit" class="btn btn-primary">Save</button></div>
            </form>
        `;
        this.addEventListeners(container, employee, onSave);
    }

    addEventListeners(container, employee, onSave) {
        container.querySelector('#employee-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const employeeData = {
                name: document.getElementById('e-name').value,
                email: document.getElementById('e-email').value,
                role: document.getElementById('e-role').value,
                specialty: document.getElementById('e-specialty').value,
            };
            const isEditing = !!employee;
            isEditing ? await this.app.dataStore.updateEmployee(employee.id, employeeData) : await this.app.dataStore.addEmployee(employeeData);
            this.app.uiManager.showNotification('Employee saved successfully!', 'success');
            if (onSave) onSave();
            window.history.back(); // Go back to the previous view (e.g., employee list)
        });
    }
}

export default EmployeeModalView;