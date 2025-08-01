export function createManagementWidget(data, context) {
    const { t, members, employees } = data;
    const { memberManagementState, employeeManagementState } = context;

    const memberList = (members && Array.isArray(members)) ? members
        .filter(m => memberManagementState.statusFilter === 'all' || m.status.toLowerCase() === memberManagementState.statusFilter)
        .filter(m => m.name.toLowerCase().includes(memberManagementState.searchTerm.toLowerCase())) : [];

    const employeeList = (employees && Array.isArray(employees)) ? employees
        .filter(e => e.name.toLowerCase().includes(employeeManagementState.searchTerm.toLowerCase())) : [];

    return {
        id: 'consolidated-management',
        title: 'Management',
        icon: '📊',
        colSpan: [1, 2, 4, 4],
        rowSpan: [1, 2, 2, 4],
        normalContent: `
            <div class="widget-summary">
                <p><strong>Members:</strong> ${members.length}</p>
                <p><strong>Employees:</strong> ${employees.length}</p>
            </div>
        `,
        expandedContent: `
            <div class="widget-tabs">
                <button class="tab-btn active" data-tab="members">Members</button>
                <button class="tab-btn" data-tab="employees">Employees</button>
            </div>
            <div class="tab-content active" data-tab-content="members">
                <p>Showing ${memberList.length} of ${members.length} members</p>
            </div>
            <div class="tab-content" data-tab-content="employees">
                <p>Showing ${employeeList.length} of ${employees.length} employees</p>
            </div>
        `,
        expandedContentL2: `
            <div class="widget-tabs">
                <button class="tab-btn active" data-tab="members">Members</button>
                <button class="tab-btn" data-tab="employees">Employees</button>
            </div>
            <div class="tab-content active" data-tab-content="members">
                <div class="widget-controls">
                    <input type="search" id="member-mgmt-search" class="form-control" placeholder="Search members..." value="${memberManagementState.searchTerm}">
                    <select id="member-mgmt-status-filter" class="form-control">
                        <option value="all" ${memberManagementState.statusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
                        <option value="active" ${memberManagementState.statusFilter === 'active' ? 'selected' : ''}>Active</option>
                        <option value="paused" ${memberManagementState.statusFilter === 'paused' ? 'selected' : ''}>Paused</option>
                        <option value="expired" ${memberManagementState.statusFilter === 'expired' ? 'selected' : ''}>Expired</option>
                    </select>
                    <a href="#/crm/members/add" class="btn btn-primary">Add Member</a>
                </div>
                <div class="table-responsive">
                    <table class="activity-table">
                        <thead><tr><th>Name</th><th>Status</th><th>Join Date</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${memberList.map(m => `
                                <tr>
                                    <td>${m.name}</td>
                                    <td><span class="status status-${m.status.toLowerCase()}">${m.status}</span></td>
                                    <td>${new Date(m.joinDate).toLocaleDateString('nl-NL')}</td>
                                    <td class="actions">
                                        <button class="btn-icon" data-action="edit-member" data-member-id="${m.id}" title="Edit">&#9998;</button>
                                        <button class="btn-icon" data-action="delete-member" data-member-id="${m.id}" title="Delete">&#128465;</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="tab-content" data-tab-content="employees">
                <div class="widget-controls">
                     <a href="#/crm/employees/add" class="btn btn-primary">Add Employee</a>
                </div>
                <div class="table-responsive">
                    <table class="activity-table">
                        <thead><tr><th>Name</th><th>Role</th><th>Hire Date</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${employeeList.map(e => `
                                <tr>
                                    <td>${e.name}</td><td>${e.role}</td><td>${new Date(e.hireDate).toLocaleDateString('nl-NL')}</td>
                                    <td class="actions"><button class="btn-icon" data-action="edit-employee" data-employee-id="${e.id}" title="Edit">&#9998;</button></td>
                                </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `,
        expandedContentL3: `
            <div class="widget-tabs">
                <button class="tab-btn active" data-tab="members">Members</button>
                <button class="tab-btn" data-tab="employees">Employees</button>
            </div>
            <div class="tab-content active" data-tab-content="members">
                <div class="widget-controls">
                    <input type="search" id="member-mgmt-search" class="form-control" placeholder="Search members..." value="${memberManagementState.searchTerm}">
                    <select id="member-mgmt-status-filter" class="form-control">
                        <option value="all" ${memberManagementState.statusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
                        <option value="active" ${memberManagementState.statusFilter === 'active' ? 'selected' : ''}>Active</option>
                        <option value="paused" ${memberManagementState.statusFilter === 'paused' ? 'selected' : ''}>Paused</option>
                        <option value="expired" ${memberManagementState.statusFilter === 'expired' ? 'selected' : ''}>Expired</option>
                    </select>
                    <a href="#/crm/members/add" class="btn btn-primary">Add Member</a>
                </div>
                <div class="table-responsive" style="height: 400px; overflow-y: auto;">
                    <table class="activity-table">
                        <thead><tr><th>Name</th><th>Status</th><th>Join Date</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${memberList.map(m => `
                                <tr>
                                    <td>${m.name}</td>
                                    <td><span class="status status-${m.status.toLowerCase()}">${m.status}</span></td>
                                    <td>${new Date(m.joinDate).toLocaleDateString('nl-NL')}</td>
                                    <td class="actions">
                                        <button class="btn-icon" data-action="edit-member" data-member-id="${m.id}" title="Edit">&#9998;</button>
                                        <button class="btn-icon" data-action="delete-member" data-member-id="${m.id}" title="Delete">&#128465;</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="tab-content" data-tab-content="employees">
                <div class="widget-controls">
                     <a href="#/crm/employees/add" class="btn btn-primary">Add Employee</a>
                </div>
                <div class="table-responsive" style="height: 400px; overflow-y: auto;">
                    <table class="activity-table">
                        <thead><tr><th>Name</th><th>Role</th><th>Hire Date</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${employeeList.map(e => `
                                <tr>
                                    <td>${e.name}</td><td>${e.role}</td><td>${new Date(e.hireDate).toLocaleDateString('nl-NL')}</td>
                                    <td class="actions"><button class="btn-icon" data-action="edit-employee" data-employee-id="${e.id}" title="Edit">&#9998;</button></td>
                                </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `,
    };
}