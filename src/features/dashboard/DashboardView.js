import { buildWidgetConfig } from './widgetConfigBuilder.js';
import { dashboardState } from './dashboardState.js';
import { addDashboardEventListeners } from './dashboardEvents.js';
import { createWidget, updateSingleWidget } from './dashboardWidgets.js';
import { analyzeHrv } from '../../core/utils.js';

export default class DashboardView {
    constructor(app) {
        this.app = app;
        this.dataStore = app.dataStore;
        this.localizationService = app.localizationService;
        this.chartInstances = {};
        this.boundSubscriptionUpdateHandler = this.handleSubscriptionUpdate.bind(this);
        this.boundFinancialsUpdateHandler = this.handleFinancialsUpdate.bind(this);

        // Methods from modules
        this.createWidget = createWidget;
        this.updateSingleWidget = (widgetId, dynamicData = null) => updateSingleWidget(this, widgetId, dynamicData);
        this.addEventListeners = (container) => addDashboardEventListeners(this, container);
        this.handleDashboardRrUpload = this.handleDashboardRrUpload.bind(this);
        this.handleIceSearch = this.handleIceSearch.bind(this);
        this.showWidgetConfigModal = this.showWidgetConfigModal.bind(this);
        this.handleWidgetExpand = this.handleWidgetExpand.bind(this);
    }

    destroy() {
        Object.values(this.chartInstances).forEach(chart => chart.destroy());
        this.chartInstances = {};
        if (this.boundBluetoothHandler) {
            this.app.bluetoothService.off('connectionStateChange', this.boundBluetoothHandler);
        }
        if (this.boundSubscriptionUpdateHandler) {
            this.dataStore.emitter.off('subscriptionUpdated', this.boundSubscriptionUpdateHandler);
        }
        if (this.boundFinancialsUpdateHandler) {
            this.dataStore.emitter.off('financialsChanged', this.boundFinancialsUpdateHandler);
        }
    }

    async handleDashboardRrUpload(file) {
        if (!file) return;
        try {
            const content = await this.app.fileService.readFileAsText(file);
            const analysisResult = analyzeHrv(content);
            dashboardState.hrvAnalysisResult = analysisResult;
            this.updateSingleWidget('training-analyser');
            this.app.uiManager.showNotification('RR-data uploaded and analyzed successfully!', 'success');
        } catch (error) {
            console.error('Error processing RR-data:', error);
            this.app.uiManager.showNotification(`Error processing RR-data: ${error.message}`, 'error');
        }
    }

    handleIceSearch(event) {
        const searchTerm = event.target.value.toLowerCase().trim();
        const resultsContainer = document.getElementById('ice-results');
        if (!resultsContainer) return;

        if (!searchTerm) {
            resultsContainer.innerHTML = '<p class="note">Enter a member name to find their emergency contact.</p>';
            return;
        }

        const members = this.dataStore.getMembers();
        const filteredMembers = members.filter(member =>
            member.name.toLowerCase().includes(searchTerm) && member.iceContactName && member.iceContactPhone
        );

        if (filteredMembers.length > 0) {
            resultsContainer.innerHTML = filteredMembers.map(member => `
                <div class="ice-result-item">
                    <p class="ice-member-name">${member.name}</p>
                    <div class="ice-contact-details">
                        <span><strong>Contact:</strong> ${member.iceContactName}</span>
                        <span><strong>Phone:</strong> <a href="tel:${member.iceContactPhone}">${member.iceContactPhone}</a></span>
                    </div>
                </div>
            `).join('');
        } else {
            resultsContainer.innerHTML = '<p class="note">No members found with that name or no ICE contact set.</p>';
        }
    }

    async handleWidgetExpand(widgetId) {
        const widgetEl = document.getElementById(widgetId);
        if (!widgetEl) return;

        const config = this.widgetConfigs.find(c => c.id === widgetId);
        if (!config) return;

        const isCurrentlyExpanded = (dashboardState.widgetExpandedState[widgetId] || 0) > 0;

        if (isCurrentlyExpanded) {
            // Always collapse to level 0
            dashboardState.widgetExpandedState[widgetId] = 0;
            this.updateSingleWidget(widgetId);
        } else {
            // Expand to level 1
            dashboardState.widgetExpandedState[widgetId] = 1;

            // If the content is dynamic (needs to be generated), fetch it first
            if (config.getExpandedContent) {
                const contentEl = widgetEl?.querySelector('.widget-content');
                if (contentEl) contentEl.innerHTML = '<div class="loading-spinner-container small"><div class="loading-spinner"></div></div>';
                try {
                    const expandedData = await this._fetchExpandedData(widgetId);
                    this.updateSingleWidget(widgetId, expandedData);
                } catch (error) {
                    console.error(`Failed to load expanded data for ${widgetId}:`, error);
                    if (contentEl) contentEl.innerHTML = '<p class="note text-danger">Error loading data.</p>';
                }
            } else {
                // For static content, just re-render
                this.updateSingleWidget(widgetId);
            }
        }
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.widget:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    /**
     * The following methods are stubs for functionality handled in dashboardEvents.js
     * but not yet fully implemented in a modal/view.
     */
    showAgeCategoryModal(category) {
        // This would show a modal with a list of members in the selected age category.
        this.app.uiManager.showNotification(`Action 'View Age Category' for '${category}' is not yet implemented.`, 'info');
    }

    showTrainerRatingsModal(trainerId) {
        // This would show a modal with detailed ratings and comments for a specific trainer.
        const trainer = this.dataStore.getEmployeeById(trainerId);
        this.app.uiManager.showNotification(`Action 'View Trainer Ratings' for ${trainer?.name || 'Unknown'} is not yet implemented.`, 'info');
    }

    showWidgetConfigModal() {
        const allWidgetConfigs = buildWidgetConfig(this._composeDashboardData(), {});
        const savedVisibility = JSON.parse(localStorage.getItem('dashboardWidgetVisibility')) || {};

        const modalBody = `
            <form id="widget-config-form">
                <p class="note">Select the widgets you want to see on your dashboard.</p>
                <div class="widget-config-list">
                    ${allWidgetConfigs.map(config => `
                        <div class="form-group form-switch-group">
                            <label class="form-switch">
                                <input type="checkbox" name="${config.id}" ${savedVisibility[config.id] !== false ? 'checked' : ''}>
                                <i></i> ${config.title}
                            </label>
                        </div>
                    `).join('')}
                </div>
            </form>
        `;

        this.app.uiManager.showModal('Configure Dashboard Widgets', `
            ${modalBody}
            <div class="modal-actions">
                <button class="btn btn-primary">Save Preferences</button>
            </div>
        `);

        this.app.uiManager.setModalSaveCallback(() => {
            const form = document.getElementById('widget-config-form');
            const formData = new FormData(form);
            const newVisibility = {};
            allWidgetConfigs.forEach(config => {
                newVisibility[config.id] = formData.has(config.id);
            });
            localStorage.setItem('dashboardWidgetVisibility', JSON.stringify(newVisibility));
            this.app.uiManager.showNotification('Dashboard preferences saved!', 'success');
            this.app.uiManager.hideModal();
            this.render(document.getElementById('main-content'));
        });
    }

    async render(container) {
        container.innerHTML = `<div class="loading-spinner-container"><div class="loading-spinner"></div></div>`;
        await new Promise(resolve => setTimeout(resolve, 50));

        this.destroy();
        const data = this._composeDashboardData();
        const context = {
            memberManagementState: dashboardState.memberManagementState,
            employeeManagementState: dashboardState.employeeManagementState,
            bluetoothState: { state: this.app.bluetoothService.getState(), deviceName: this.app.bluetoothService.getDevice()?.name },
            members: this.dataStore.getMembers(), // Add missing members to context
            employees: this.dataStore.getEmployees(),
            hrvAnalysisResult: dashboardState.hrvAnalysisResult
        };
        
        const savedVisibility = JSON.parse(localStorage.getItem('dashboardWidgetVisibility')) || {};
        this.widgetConfigs = buildWidgetConfig(data, context).filter(config => savedVisibility[config.id] !== false);

        let widgetConfigs = this.widgetConfigs;

        try {
            const savedOrderJSON = localStorage.getItem('dashboardWidgetOrder');
            if (savedOrderJSON) {
                const savedOrder = JSON.parse(savedOrderJSON);
                const configMap = new Map(widgetConfigs.map(c => [c.id, c]));
                const orderedConfigs = savedOrder.map(id => configMap.get(id)).filter(Boolean);
                const orderedIds = new Set(orderedConfigs.map(c => c.id));
                const newConfigs = widgetConfigs.filter(c => !orderedIds.has(c.id));
                widgetConfigs = [...orderedConfigs, ...newConfigs];
            }
        } catch (error) {
            console.error('Failed to load or apply saved dashboard order:', error);
        }

        container.innerHTML = `
            <div class="view-header">
                <h1>Admin Dashboard</h1>
                <div class="view-header-actions">
                    <button id="configure-widgets-btn" class="btn btn-secondary">Configure Widgets</button>
                    <button id="reset-layout-btn" class="btn btn-secondary">Reset Layout</button>
                </div>
            </div>
            <p class="view-subheader">Overview of gym operations and member activity.</p>
            <div id="dashboard-grid" class="dashboard-grid">
                ${widgetConfigs.map(config => {
                    try {
                        return this.createWidget(config);
                    } catch (error) {
                        console.error(`Error rendering widget: ${config.id}`, error);
                        // Return a fallback error widget
                        return `<div id="${config.id}" class="widget error-widget">
                                    <div class="widget-header"><h3>⚠️ Error: ${config.title}</h3></div>
                                    <div class="widget-content"><p>This widget failed to render.</p><pre class="note">${error.message}</pre></div>
                                </div>`;
                    }
                }).join('')}
            </div>
        `;

        this.addEventListeners(container);
        this.dataStore.emitter.on('subscriptionUpdated', this.boundSubscriptionUpdateHandler);
        this.dataStore.emitter.on('financialsChanged', this.boundFinancialsUpdateHandler);
        this.renderCharts(widgetConfigs);
    }

    handleSubscriptionUpdate({ memberId }) {
        console.log(`Dashboard detected subscription update for member ${memberId}. Refreshing relevant widgets.`);
        this.updateSingleWidget('member-management');
    }

    handleFinancialsUpdate() {
        console.log(`Dashboard detected financial update. Refreshing financial widget.`);
        this.updateSingleWidget('financial-management');
    }

    renderCharts(configs) {
        if (!configs) return;
        configs.forEach(config => {
            if (config && config.chart) {
                this.renderSingleChart(config.chart);
            }
        });
    }

    renderSingleChart(chartConfig) { // No longer needs to be async
        const canvas = document.getElementById(chartConfig.id);
        if (!canvas) return;

        // By the time this view renders, App.init() has already loaded Chart.js.
        if (typeof Chart === 'undefined') {
            console.error(`Chart.js is not available, cannot render chart: ${chartConfig.id}`);
            if (canvas.parentElement) canvas.parentElement.innerHTML = '<p class="note text-danger">Error: Chart library unavailable.</p>';
            return;
        }

        if (this.chartInstances[chartConfig.id]) {
            this.chartInstances[chartConfig.id].destroy();
        }
        this.chartInstances[chartConfig.id] = new Chart(canvas.getContext('2d'), chartConfig.config);
    }

    /**
     * Composes all necessary data for the dashboard, providing defaults for resilience.
     * @returns {object} A comprehensive data object for rendering widgets.
     */
    _composeDashboardData() {
        // --- Raw Data with Defaults ---
        const members = this.dataStore.getMembers() || [];
        const products = this.dataStore.getProducts() || [];
        const subscriptions = this.dataStore.getSubscriptions() || [];
        const employees = this.dataStore.getEmployees() || [];
        const workoutLogs = this.dataStore.getWorkoutLogs() || [];
        const schemas = this.dataStore.getWorkoutSchemas() || [];
        const scheduledWorkouts = this.dataStore.getScheduledWorkouts() || [];
        const invoices = this.dataStore.getInvoices() || [];
        const expenses = this.dataStore.getExpenses() || [];
        const expenseCategories = this.dataStore.getExpenseCategories() || [];

        // --- Calculated Data ---
        const financialSummary = this.dataStore.getFinancialSummary() || { totalRevenue: 0, totalExpenses: 0, netProfit: 0 };
        const activeMembers = this.dataStore.getActiveMembersCount() || 0;
        const pausedMembers = members.filter(m => m.status === 'Paused').length;
        const expiredMembers = members.filter(m => m.status === 'Expired').length;
        const todayStr = new Date().toISOString().slice(0, 10);
        const sessionsTodayCount = workoutLogs.filter(log => log.date === todayStr).length;

        // --- Complex Calculations ---
        const classPopularity = this._calculateClassPopularity(workoutLogs, schemas);
        const memberGrowth = this._calculateMemberGrowth(members);
        const trainerRatingDetails = this.dataStore.getTrainerRatingDetails ? this.dataStore.getTrainerRatingDetails() : [];

        return {
            t: (key, ...args) => this.localizationService.t(key, ...args),
            members,
            products,
            subscriptions,
            employees,
            workoutLogs: workoutLogs.slice(0, 5), // For recent activity widget
            schemas,
            scheduledWorkouts,
            invoices,
            expenses,
            expenseCategories,
            financialSummary,
            activeMembers,
            pausedMembers,
            expiredMembers,
            netMemberGrowth: activeMembers - (pausedMembers + expiredMembers),
            sessionsToday: sessionsTodayCount,
            gymOccupancy: this.dataStore.getDetailedGymOccupancy() || { percentage: 0, roomDetails: [] },
            avgTrainerRating: this.dataStore.getAverageTrainerRating() || 0,
            classPopularity,
            memberGrowth,
            trainerRatingDetails,
        };
    }

    _calculateClassPopularity(workoutLogs, schemas) {
        if (!workoutLogs || !schemas) return [];
        const classPopularityMap = workoutLogs.reduce((acc, log) => {
            if (log.schemaId) {
                acc[log.schemaId] = (acc[log.schemaId] || 0) + 1;
            }
            return acc;
        }, {});
        return Object.entries(classPopularityMap)
            .map(([schemaId, count]) => {
                const schema = schemas.find(s => s.id === schemaId);
                return { name: schema ? schema.name : 'Unknown Schema', count };
            })
            .sort((a, b) => b.count - a.count)
            .map(item => [item.name, item.count]);
    }

    _calculateMemberGrowth(members) {
        if (!members) return { labels: [], data: [] };
        const monthlyChanges = members.reduce((acc, member) => {
            const getMonthKey = (dateStr) => new Date(dateStr).toISOString().slice(0, 7);

            // Track Joins
            if (member.joinDate) {
                const joinMonth = getMonthKey(member.joinDate);
                if (!acc[joinMonth]) acc[joinMonth] = { net: 0 };
                acc[joinMonth].net++;
            }
            // Track Departures (based on contract end date in the past)
            if (member.contractEndDate && new Date(member.contractEndDate) < new Date()) {
                const departureMonth = getMonthKey(member.contractEndDate);
                if (!acc[departureMonth]) acc[departureMonth] = { net: 0 };
                acc[departureMonth].net--;
            }
            return acc;
        }, {});

        const sortedMonths = Object.keys(monthlyChanges).sort();
        const allMonths = [];
        if (sortedMonths.length > 0) {
            let currentDate = new Date(sortedMonths[0] + '-01T12:00:00Z');
            const lastDate = new Date(sortedMonths[sortedMonths.length - 1] + '-01T12:00:00Z');
            while (currentDate <= lastDate) {
                allMonths.push(currentDate.toISOString().slice(0, 7));
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
        }
        return {
            labels: allMonths,
            data: allMonths.map(month => monthlyChanges[month]?.net || 0)
        };
    }

    async _fetchExpandedData(widgetId) {
        // In a real app, this would make targeted API calls. Here, we get from dataStore.
        switch (widgetId) {
            case 'sessions-today': {
                const members = this.dataStore.getMembers();
                const schemas = this.dataStore.getWorkoutSchemas();
                const workoutLogs = this.dataStore.getWorkoutLogs();
                const todayStr = new Date().toISOString().slice(0, 10);
                const sessionsTodayDetailsLogs = workoutLogs.filter(log => log.date === todayStr);
                return { members, schemas, sessionsTodayDetailsLogs };
            }
            case 'membership-status': {
                const members = this.dataStore.getMembers();
                return { members };
            }
            // Add cases for other lazy-loadable widgets
            default:
                return {};
        }
    }
}