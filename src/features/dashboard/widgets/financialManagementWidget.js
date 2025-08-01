export function createFinancialManagementWidget(data, context) {
    const { t, financialSummary = { totalRevenue: 0, totalExpenses: 0, netProfit: 0 }, invoices = [] } = data;
    
    const recentInvoices = (invoices || [])
        .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
        .slice(0, 5)
        .map(inv => `
            <tr>
                <td>${inv.id}</td>
                <td><a href="#/crm/members/edit/${inv.memberId}">${context.members.find(m => m.id === inv.memberId)?.name || 'N/A'}</a></td>
                <td>€ ${inv.amount.toFixed(2)}</td>
                <td>${new Date(inv.dueDate).toLocaleDateString()}</td>
                <td><span class="status status-${inv.status.toLowerCase()}">${inv.status}</span></td>
            </tr>
        `).join('');

    return {
        id: 'financial-management',
        title: t('financialOverview', 'Financial Management'),
        icon: '💰',
        colSpan: 4,
        rowSpan: 2,
        normalContent: `
            <div class="kpi-group horizontal" style="justify-content: space-around; margin-bottom: 1.5rem;">
                <div class="kpi-item">
                    <p class="kpi-label">${t('revenue', 'Total Revenue')}</p>
                    <p class="kpi-value">€ ${financialSummary.totalRevenue.toLocaleString('nl-NL')}</p>
                </div>
                <div class="kpi-item">
                    <p class="kpi-label">${t('expenses', 'Total Expenses')}</p>
                    <p class="kpi-value">€ ${financialSummary.totalExpenses.toLocaleString('nl-NL')}</p>
                </div>
                <div class="kpi-item">
                    <p class="kpi-label">${t('netProfit', 'Net Profit')}</p>
                    <p class="kpi-value">€ ${financialSummary.netProfit.toLocaleString('nl-NL')}</p>
                </div>
            </div>
            <h4>Recent Invoices</h4>
            <table class="activity-table">
                <thead>
                    <tr>
                        <th>Invoice #</th>
                        <th>Member</th>
                        <th>Amount</th>
                        <th>Due Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentInvoices || `<tr><td colspan="5">No recent invoices.</td></tr>`}
                </tbody>
            </table>
            <div class="widget-actions">
                <a href="#/billing" class="btn btn-primary">Go to Billing & Invoices</a>
                <a href="#/reports" class="btn">View Financial Reports</a>
            </div>
        `,
    };
}