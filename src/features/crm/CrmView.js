import { debounce } from '../../core/utils.js';

export default class CrmView {
    constructor(app) {
        this.app = app;
        this.memberSearchTerm = '';
        this.memberStatusFilter = 'Active';
        this.employeeSearchTerm = '';
        this.employeeRoleFilter = 'all';
    }

    render(container) {

        container.innerHTML = `
            <div class="view-header">
                <h1>CRM</h1>
                <div class="view-header-actions">
                    <button data-action="add-member" class="btn btn-primary">Add Member</button>
                    <button data-action="add-employee" class="btn btn-secondary">Add Employee</button>
                </div>
            </div>
            <p class="view-subheader">Manage all members, employees, and user accounts.</p>
            <div class="settings-grid">
                <div class="widget">
                    <h3>Member Management</h3>
                    <div class="view-controls" style="padding: 0; background: none; margin-bottom: 1rem;">
                        <input type="search" id="member-search-input" class="form-control" placeholder="Search members..." value="${this.memberSearchTerm}">
                        <select id="member-status-filter" class="form-control">
                            <option value="all" ${this.memberStatusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
                            <option value="Active" ${this.memberStatusFilter === 'Active' ? 'selected' : ''}>Active</option>
                            <option value="Paused" ${this.memberStatusFilter === 'Paused' ? 'selected' : ''}>Paused</option>
                            <option value="Expired" ${this.memberStatusFilter === 'Expired' ? 'selected' : ''}>Expired</option>
                        </select>
                    </div>
                    <div id="crm-member-list"></div>
                </div>
                <div class="widget">
                    <h3>Employee Management</h3>
                     <div class="view-controls" style="padding: 0; background: none; margin-bottom: 1rem;">
                        <input type="search" id="employee-search-input" class="form-control" placeholder="Search employees..." value="${this.employeeSearchTerm}">
                        <select id="employee-role-filter" class="form-control">
                            <option value="all" ${this.employeeRoleFilter === 'all' ? 'selected' : ''}>All Roles</option>
                            <option value="Admin" ${this.employeeRoleFilter === 'Admin' ? 'selected' : ''}>Admin</option>
                            <option value="Coach" ${this.employeeRoleFilter === 'Coach' ? 'selected' : ''}>Coach</option>
                        </select>
                    </div>
                    <div id="crm-employee-list"></div>
                </div>
            </div>
        `;
        this.addEventListeners();
        this.renderMemberTable();
        this.renderEmployeeTable();
    }

    renderMemberTable() {
        const container = document.getElementById('crm-member-list');
        if (!container) return;

        let members = this.app.dataStore.getMembers();
        if (this.memberStatusFilter !== 'all') {
            members = members.filter(m => m.status === this.memberStatusFilter);
        }
        if (this.memberSearchTerm) {
            const term = this.memberSearchTerm.toLowerCase();
            members = members.filter(m => m.name.toLowerCase().includes(term) || m.email.toLowerCase().includes(term));
        }

        container.innerHTML = `
            <table class="activity-table">
                <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                    ${members.map(m => `
                        <tr>
                            <td>${m.name}</td>
                            <td>${m.email}</td>
                            <td><span class="status status-${m.status.toLowerCase()}">${m.status}</span></td>
                            <td class="actions">
                                <button class="btn-icon" data-action="edit-member" data-id="${m.id}" title="Edit">&#9998;</button>
                                <button class="btn-icon" data-action="delete-member" data-id="${m.id}" title="Delete">&#128465;</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${members.length === 0 ? '<p class="note">No members match the current filters.</p>' : ''}
        `;
    }

    renderEmployeeTable() {
        const container = document.getElementById('crm-employee-list');
        if (!container) return;

        let employees = this.app.dataStore.getEmployees();
        if (this.employeeRoleFilter !== 'all') {
            employees = employees.filter(e => e.role === this.employeeRoleFilter);
        }
        if (this.employeeSearchTerm) {
            const term = this.employeeSearchTerm.toLowerCase();
            employees = employees.filter(e => e.name.toLowerCase().includes(term) || e.email.toLowerCase().includes(term));
        }

        container.innerHTML = `
            <table class="activity-table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
                <tbody>
                    ${employees.map(e => `
                        <tr>
                            <td>${e.name}</td>
                            <td>${e.email}</td>
                            <td>${e.role}</td>
                            <td class="actions">
                                <button class="btn-icon" data-action="edit-employee" data-id="${e.id}" title="Edit">&#9998;</button>
                                <button class="btn-icon" data-action="delete-employee" data-id="${e.id}" title="Delete">&#128465;</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${employees.length === 0 ? '<p class="note">No employees match the current filters.</p>' : ''}
        `;
    }

    addEventListeners() {
        document.body.addEventListener('click', e => {
            const button = e.target.closest('button[data-action]');
            if (!button) return;

            const action = button.dataset.action;
            switch (action) {
                case 'add-member':
                    this.app.router.navigate('#/crm/members/add');
                    break;
                case 'edit-member':
                    this.app.router.navigate(`#/crm/members/edit/${button.dataset.id}`);
                    break;
                case 'delete-member':
                    this.app.uiManager.showConfirmation('Delete Member?', `Are you sure you want to delete this member?`).then(confirmed => {
                        if (confirmed) {
                            this.app.dataStore.deleteMember(button.dataset.id).then(() => this.renderMemberTable());
                            this.app.uiManager.showNotification('Member deleted.', 'success');
                        }
                    });
                    break;
                case 'add-employee':
                    this.app.router.navigate('#/crm/employees/add');
                    break;
                case 'edit-employee':
                    this.app.router.navigate(`#/crm/employees/edit/${button.dataset.id}`);
                    break;
                case 'delete-employee':
                     this.app.uiManager.showConfirmation('Delete Employee?', `Are you sure you want to delete this employee?`).then(confirmed => {
                        if (confirmed) {
                            this.app.dataStore.deleteEmployee(button.dataset.id).then(() => this.renderEmployeeTable());
                            this.app.uiManager.showNotification('Employee deleted.', 'success');
                        }
                    });
                    break;
            }
        });

        document.getElementById('member-search-input').addEventListener('input', debounce((e) => {
            this.memberSearchTerm = e.target.value;
            this.renderMemberTable();
        }, 300));
        document.getElementById('member-status-filter').addEventListener('change', (e) => {
            this.memberStatusFilter = e.target.value;
            this.renderMemberTable();
        });
        document.getElementById('employee-search-input').addEventListener('input', debounce((e) => {
            this.employeeSearchTerm = e.target.value;
            this.renderEmployeeTable();
        }, 300));
        document.getElementById('employee-role-filter').addEventListener('change', (e) => {
            this.employeeRoleFilter = e.target.value;
            this.renderEmployeeTable();
        });
    }
}