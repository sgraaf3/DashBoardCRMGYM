export function createMemberManagementWidget(data, context) {
    const { t, members = [] } = data;
    const { memberManagementState } = context;

    const memberRows = (members || [])
        .filter(member => {
            const statusMatch = memberManagementState.statusFilter === 'all' || member.status.toLowerCase() === memberManagementState.statusFilter;
            const searchMatch = !memberManagementState.searchTerm || member.name.toLowerCase().includes(memberManagementState.searchTerm.toLowerCase());
            return statusMatch && searchMatch;
        })
        .slice(0, 10) // Limit to 10 for display
        .map(member => `
            <tr>
                <td><a href="#/crm/members/edit/${member.id}">${member.name}</a></td>
                <td>${member.email}</td>
                <td><span class="status status-${member.status.toLowerCase()}">${member.status}</span></td>
                <td>${member.subscription?.plan || 'N/A'}</td>
                <td class="actions">
                    <a href="#/crm/members/edit/${member.id}" class="btn-icon" title="Edit">&#9998;</a>
                    <a href="#/workout-planner-member-progress/detail/${member.id}" class="btn-icon" title="View Progress">&#128202;</a>
                    <button class="btn-icon" data-action="delete-member" data-member-id="${member.id}" title="Delete">&#128465;</button>
                </td>
            </tr>
        `).join('');

    return {
        id: 'member-management',
        title: t('crm.members.title', 'Member Management'),
        icon: '👥',
        colSpan: 4,
        rowSpan: 2,
        normalContent: `
            <div class="member-list-controls">
                <input type="search" id="member-search-input" class="form-control" placeholder="${t('crm.searchPlaceholder', 'Search members...')}" value="${memberManagementState.searchTerm || ''}">
                <select id="member-status-filter" class="form-control">
                    <option value="all" ${memberManagementState.statusFilter === 'all' ? 'selected' : ''}>${t('crm.statusAll', 'All Statuses')}</option>
                    <option value="active" ${memberManagementState.statusFilter === 'active' ? 'selected' : ''}>${t('crm.statusActive', 'Active')}</option>
                    <option value="paused" ${memberManagementState.statusFilter === 'paused' ? 'selected' : ''}>Paused</option>
                    <option value="expired" ${memberManagementState.statusFilter === 'expired' ? 'selected' : ''}>Expired</option>
                </select>
                <a href="#/crm/members/add" class="btn btn-primary">${t('crm.addmember', 'Add Member')}</a>
            </div>
            <table class="activity-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Subscription</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${memberRows || `<tr><td colspan="5">No members found.</td></tr>`}
                </tbody>
            </table>
            <div class="widget-actions">
                <a href="#/crm" class="btn btn-sm">View All Members</a>
            </div>
        `,
    };
}