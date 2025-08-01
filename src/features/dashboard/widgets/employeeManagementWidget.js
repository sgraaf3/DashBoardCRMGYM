export function createEmployeeManagementWidget(data, context) {
    const { t, employees = [] } = data;
    const { employeeManagementState } = context;

    const employeeRows = (employees || [])
        .filter(emp => {
            const roleMatch = employeeManagementState.roleFilter === 'all' || emp.role.toLowerCase() === employeeManagementState.roleFilter;
            const searchMatch = !employeeManagementState.searchTerm || emp.name.toLowerCase().includes(employeeManagementState.searchTerm.toLowerCase());
            return roleMatch && searchMatch;
        })
        .slice(0, 10)
        .map(emp => `
            <tr>
                <td><a href="#/crm/employees/edit/${emp.id}">${emp.name}</a></td>
                <td>${emp.role}</td>
                <td>${emp.email}</td>
                <td><span class="status status-${emp.status.toLowerCase()}">${emp.status}</span></td>
                <td class="actions">
                    <a href="#/crm/employees/edit/${emp.id}" class="btn-icon" title="Edit">&#9998;</a>
                    <button class="btn-icon" data-action="delete-employee" data-employee-id="${emp.id}" title="Delete">&#128465;</button>
                </td>
            </tr>
        `).join('');

    return {
        id: 'employee-management',
        title: t('crm.employees.title', 'Employee Management'),
        icon: '👨‍💼',
        colSpan: 4,
        rowSpan: 2,
        normalContent: `
            <div class="member-list-controls">
                <input type="search" id="employee-search-input" class="form-control" placeholder="${t('crm.employees.searchPlaceholder', 'Search employees...')}" value="${employeeManagementState.searchTerm || ''}">
                <select id="employee-role-filter" class="form-control">
                    <option value="all" ${employeeManagementState.roleFilter === 'all' ? 'selected' : ''}>${t('crm.employees.roleAll', 'All Roles')}</option>
                    <option value="admin" ${employeeManagementState.roleFilter === 'admin' ? 'selected' : ''}>${t('crm.employees.roleAdmin', 'Admin')}</option>
                    <option value="coach" ${employeeManagementState.roleFilter === 'coach' ? 'selected' : ''}>${t('crm.employees.roleCoach', 'Coach')}</option>
                </select>
                <a href="#/crm/employees/add" class="btn btn-primary">${t('crm.employees.addEmployee', 'Add Employee')}</a>
            </div>
            <table class="activity-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${employeeRows || `<tr><td colspan="5">No employees found.</td></tr>`}
                </tbody>
            </table>
             <div class="widget-actions">
                <a href="#/crm" class="btn btn-sm">View All Employees</a>
            </div>
        `,
    };
}