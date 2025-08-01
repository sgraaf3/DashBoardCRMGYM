
export default class BillingView {
    constructor(app) {
        this.app = app;
        this.element = null; // The root element of the view
        this.revenueChart = null; // To hold the chart instance
    }

    render(container, model = null) {
        container.innerHTML = `
            <div class="view-header">
                <h1>Billing & Subscriptions</h1>
                <div class="view-header-actions">
                    <a href="#/settings/invoice-templates" class="btn btn-secondary">Customize Invoice Template</a>
                </div>
            </div>
            <div class="settings-grid">
                <div class="widget">
                    <h3>Automated Billing Cycle</h3>
                    <div id="billing-cycle-status"></div>
                    <div class="widget-actions">
                        <button data-action="cycle-start" class="btn btn-success">Start</button>
                        <button data-action="cycle-stop" class="btn btn-danger">Stop</button>
                        <button data-action="cycle-run-now" class="btn">Run Now</button>
                    </div>
                </div>
                <div class="widget">
                    <h3>Member Subscriptions</h3>
                    <div id="subscription-list"></div>
                </div>
                <div class="invoices-section widget">
                    <h3>Invoices</h3>
                    <div class="invoice-controls">
                        <div class="invoice-actions">
                            <button id="generate-invoices" class="btn">Generate Due Invoices</button>
                            <select id="invoice-filter">
                                <option value="all">All</option>
                                <option value="Pending">Pending</option>
                                <option value="Paid">Paid</option>
                                <option value="Refunded">Refunded</option>
                            </select>
                        </div>
                        <div class="invoice-actions">
                            <button data-action="download-all-invoices" class="btn btn-secondary">Download All</button>
                            <button data-action="print-all-invoices" class="btn btn-secondary">Print All</button>
                        </div>
                    </div>
                    <div id="invoice-list"></div>
                    <div class="invoice-summary">
                        <p>Total Pending: <strong id="total-pending"></strong></p>
                        <p>Total Paid: <strong id="total-paid"></strong></p>
                    </div>
                </div>
                <div class="revenue-chart-section widget">
                    <h3>Revenue Chart</h3>
                     <div class="chart-container" style="position: relative; height:40vh; width:100%">
                        <canvas id="revenue-chart"></canvas>
                    </div>
                </div>
            </div>
        `;
        this.element = container; // Keep a reference to the container
        this.init();
    }

    async init() {
        this.loadSubscriptions();
        this.loadInvoices(); // Load with default filter
        this.setupEventListeners();
        this.updateBillingCycleStatus();
    }

    async loadSubscriptions() {
        const members = this.app.dataStore.getMembers();
        const subscriptions = members
            .filter(m => m.subscription)
            .map(m => ({ ...m.subscription, memberName: m.name, id: m.id }));

        const subscriptionList = this.element.querySelector('#subscription-list');
        if (!subscriptionList) return;

        if (subscriptions.length === 0) {
            subscriptionList.innerHTML = '<p>No subscriptions found.</p>';
            return;
        }

        subscriptionList.innerHTML = `
            <table class="activity-table">
                <thead>
                    <tr><th>Member</th><th>Plan</th><th>Status</th><th>Renews On</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${subscriptions.map(sub => `
                        <tr>
                            <td>${sub.memberName}</td>
                            <td>${sub.plan}</td>
                            <td><span class="status status-${sub.status.toLowerCase()}">${sub.status}</span></td>
                            <td>${new Date(sub.renewalDate).toLocaleDateString('nl-NL')}</td>
                            <td class="actions"><button data-member-id="${sub.id}" data-action="manage-subscription" class="btn btn-sm">Manage</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    async loadInvoices(filter = 'all') {
        let invoices = this.app.dataStore.getInvoices();
        const invoiceList = this.element.querySelector('#invoice-list');
        if (!invoiceList) return;

        if (invoices.length === 0) {
            invoiceList.innerHTML = `<p class="note">No invoices found for this filter.</p>`;
        } else {
            invoiceList.innerHTML = [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date)).map(inv => `
                <div class="invoice-item">
                    <div>
                        <strong>${this.app.dataStore.getMemberById(inv.memberId)?.name || 'Unknown Member'}</strong> - €${inv.amount.toFixed(2)}
                        <span class="status status-${inv.status.toLowerCase()}">${inv.status}</span>
                    </div>
                    <div class="note">Date: ${new Date(inv.date).toLocaleDateString('nl-NL')}</div>
                    <div class="invoice-item-actions">
                        <button data-id="${inv.id}" data-action="mark-paid" class="btn btn-sm btn-success" ${inv.status !== 'Pending' ? 'disabled' : ''}>Mark Paid</button>
                        <button data-id="${inv.id}" data-action="refund" class="btn btn-sm btn-warning" ${inv.status !== 'Paid' ? 'disabled' : ''}>Refund</button>
                        <button data-id="${inv.id}" data-action="download-invoice" class="btn btn-sm btn-secondary">Download</button>
                        <button data-id="${inv.id}" data-action="print-invoice" class="btn btn-sm btn-secondary">Print</button>
                    </div>
                </div>
            `).join('');
        }

        // Summary should be based on all invoices, not the filtered list
        const allInvoices = this.app.dataStore.getInvoices();
        this.updateInvoiceSummary(allInvoices);
        this.renderRevenueChart(allInvoices);
    }

    updateInvoiceSummary(invoices) {
        const totalPending = invoices.filter(inv => inv.status === 'Pending').reduce((sum, inv) => sum + inv.amount, 0);
        const totalPaid = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);
        this.element.querySelector('#total-pending').textContent = `€${totalPending.toFixed(2)}`;
        this.element.querySelector('#total-paid').textContent = `€${totalPaid.toFixed(2)}`;
    }

    setupEventListeners() {
        this.element.addEventListener('click', async (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            const action = button.id === 'generate-invoices' ? 'generate-invoices' : button.dataset.action;
            const invoiceId = parseInt(button.dataset.id, 10);
            const memberId = button.dataset.memberId;

            switch (action) {
                case 'generate-invoices':
                    const members = this.app.dataStore.getMembers();
                    const invoices = this.app.dataStore.getInvoices();
                    const upcomingRenewalDays = 30;
                    let generatedCount = 0;

                    for (const member of members) {
                        if (member.subscription?.status !== 'Active') continue;

                        const renewalDate = new Date(member.subscription.renewalDate);
                        const today = new Date();
                        const diffDays = (renewalDate - today) / (1000 * 60 * 60 * 24);

                        if (diffDays > 0 && diffDays <= upcomingRenewalDays) {
                            const existingInvoice = invoices.find(inv =>
                                inv.memberId === member.id &&
                                inv.status === 'Pending' &&
                                new Date(inv.date).getMonth() === renewalDate.getMonth()
                            );

                            if (!existingInvoice) {
                                const planDetails = { description: member.subscription.plan, price: member.subscription.plan === 'Premium Monthly' ? 99.99 : 49.99 };
                                await this.app.dataStore.addInvoice({
                                    memberId: member.id,
                                    amount: planDetails.price,
                                    date: new Date().toISOString().split('T')[0],
                                    status: 'Pending',
                                    items: [{ ...planDetails, quantity: 1 }]
                                });
                                generatedCount++;
                            }
                        }
                    }
                    this.app.uiManager.showNotification(`${generatedCount} new invoice(s) generated.`, 'success');
                    this.loadInvoices(this.element.querySelector('#invoice-filter').value);
                    break;
                case 'cycle-start':
                    this.app.billingCycleService.start();
                    this.app.uiManager.showNotification('Automated billing started.', 'success');
                    this.updateBillingCycleStatus();
                    break;
                case 'cycle-stop':
                    this.app.billingCycleService.stop();
                    this.app.uiManager.showNotification('Automated billing stopped.', 'info');
                    this.updateBillingCycleStatus();
                    break;
                case 'cycle-run-now':
                    button.disabled = true;
                    button.textContent = 'Running...';
                    await this.app.billingCycleService.runNow();
                    button.disabled = false;
                    button.textContent = 'Run Now';
                    this.loadInvoices('all'); // Refresh invoices
                    break;
                case 'manage-subscription':
                    this.app.router.navigate(`#/crm/subscription/${memberId}`);
                    break;
                case 'mark-paid':
                    await this.app.dataStore.updateInvoice(invoiceId, { status: 'Paid' });
                    this.app.uiManager.showNotification('Invoice marked as Paid.', 'success');
                    this.loadInvoices(this.element.querySelector('#invoice-filter').value);
                    break;
                case 'refund':
                    await this.app.dataStore.updateInvoice(invoiceId, { status: 'Refunded' });
                    this.app.uiManager.showNotification('Invoice marked as Refunded.', 'info');
                    this.loadInvoices(this.element.querySelector('#invoice-filter').value);
                    break;
                case 'download-invoice':
                    const invoiceToDownload = this.app.dataStore.getInvoices().find(i => i.id === invoiceId);
                    if (invoiceToDownload) {
                        this.app.pdfService.generateInvoicePdf(invoiceToDownload);
                        this.app.uiManager.showNotification(`Downloading invoice #${invoiceId}...`, 'info');
                    }
                    break;
                case 'print-invoice':
                    const invoiceToPrint = this.app.dataStore.getInvoices().find(i => i.id === invoiceId);
                    if (invoiceToPrint) {
                        this.app.pdfService.printInvoice(invoiceToPrint);
                        this.app.uiManager.showNotification(`Preparing invoice #${invoiceId} for printing...`, 'info');
                    }
                    break;
                case 'download-all-invoices':
                    this.app.uiManager.showNotification('Downloading all invoices... (Not implemented)', 'info');
                    break;
                case 'print-all-invoices':
                    this.app.uiManager.showNotification('Printing all invoices... (Not implemented)', 'info');
                    break;
            }
        });

        this.element.querySelector('#invoice-filter').addEventListener('change', (e) => {
            this.loadInvoices(e.target.value);
        });
    }

    updateBillingCycleStatus() {
        const statusContainer = this.element.querySelector('#billing-cycle-status');
        if (!statusContainer) return;

        const service = this.app.billingCycleService;
        const status = service.isRunning ? 'Running' : 'Stopped';
        const statusClass = service.isRunning ? 'status-active' : 'status-cancelled';
        const lastRun = service.lastRun ? service.lastRun.toLocaleString('nl-NL') : 'Never';
        const nextRun = service.nextRun ? service.nextRun.toLocaleString('nl-NL') : 'N/A';

        statusContainer.innerHTML = `
            <p><strong>Status:</strong> <span class="status ${statusClass}">${status}</span></p>
            <p><strong>Last Run:</strong> ${lastRun}</p>
            <p><strong>Next Scheduled Run:</strong> ${nextRun}</p>`;
    }

    renderRevenueChart(allInvoices) {
        const allExpenses = this.app.dataStore.getExpenses();

        const paidInvoices = allInvoices.filter(inv => inv.status === 'Paid');
        const monthlyRevenue = paidInvoices.reduce((acc, inv) => {
            // Use 'YYYY-MM' format for robust sorting
            const month = new Date(inv.date).toISOString().slice(0, 7);
            acc[month] = (acc[month] || 0) + inv.amount;
            return acc;
        }, {});

        const monthlyExpenses = allExpenses.reduce((acc, exp) => {
            const month = new Date(exp.date).toISOString().slice(0, 7);
            acc[month] = (acc[month] || 0) + exp.amount;
            return acc;
        }, {});

        // Combine keys from both revenue and expenses to create a complete timeline
        const allMonths = [...new Set([...Object.keys(monthlyRevenue), ...Object.keys(monthlyExpenses)])].sort();

        const chartLabels = allMonths.map(month => {
            const [year, monthNum] = month.split('-');
            return new Date(year, monthNum - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
        });
        const revenueData = allMonths.map(month => monthlyRevenue[month] || 0);
        const expenseData = allMonths.map(month => monthlyExpenses[month] || 0);

        const chartCanvas = this.element.querySelector('#revenue-chart');
        if (this.revenueChart) {
            this.revenueChart.destroy();
        }

        // By the time this view renders, App.init() has already loaded Chart.js.
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not available, cannot render revenue chart.');
            if (chartCanvas.parentElement) chartCanvas.parentElement.innerHTML = '<p class="note text-danger">Error: Chart library unavailable.</p>';
            return;
        }

        this.revenueChart = new Chart(chartCanvas, {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [
                    {
                        label: 'Monthly Revenue',
                        data: revenueData,
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Monthly Expenses',
                        data: expenseData,
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                scales: {
                    x: {
                        stacked: false,
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '€' + value;
                            }
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
}