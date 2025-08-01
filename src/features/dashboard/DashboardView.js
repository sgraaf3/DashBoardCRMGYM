import { addDashboardEventListeners } from './dashboardEvents.js';
import { dashboardState } from './dashboardState.js';
import { createWidget, updateSingleWidget } from './dashboardWidgets.js';
import { buildWidgetConfig } from './widgetConfigBuilder.js';
import debounce from '../../utils/domUtils.js';

export class DashboardView {
    constructor(app) {
        this.app = app;
        this.container = null;
        this.dataStore = app.dataStore;
        this.uiManager = app.uiManager;
        this.localizationService = app.localizationService;
        this.boundBluetoothHandler = null;

        this.handleIceSearch = debounce(this._handleIceSearch.bind(this), 300);
    }

    getHTML() {
        const t = this.localizationService.t.bind(this.localizationService);
        return `
            <div id="dashboard-view" class="h-full flex flex-col p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                <div class="flex justify-between items-center mb-4">
                    <h1 class="text-2xl font-bold">${t('dashboard.title')}</h1>
                    <div class="flex items-center space-x-2">
                        <input type="search" id="ice-search" placeholder="${t('dashboard.searchPlaceholder')}" class="form-input-class">
                        <button id="configure-widgets-btn" class="btn-secondary">${t('dashboard.configureWidgets')}</button>
                        <button id="reset-layout-btn" class="btn-secondary">${t('dashboard.resetLayout')}</button>
                    </div>
                </div>
                <div id="dashboard-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-grow overflow-y-auto">
                    <!-- Widgets will be rendered here -->
                </div>
            </div>
        `;
    }

    render(container) {
        this.container = container;
        this.container.innerHTML = this.getHTML();
        this.onRender();
    }

    onRender() {
        this._renderWidgets();
        this.addEventListeners(this.container);
    }

    _renderWidgets() {
        const grid = this.container.querySelector('#dashboard-grid');
        if (!grid) return;

        const dashboardData = this._composeDashboardData();
        const widgetContext = this._getWidgetContext();
        const allWidgetConfigs = buildWidgetConfig(dashboardData, widgetContext);

        const userWidgetConfig = this.app.settings.get('dashboardWidgets', allWidgetConfigs.map(w => w.id));
        const activeWidgetConfigs = allWidgetConfigs.filter(w => userWidgetConfig.includes(w.id));

        const savedOrder = JSON.parse(localStorage.getItem('dashboardWidgetOrder'));
        const orderedConfigs = savedOrder
            ? activeWidgetConfigs.sort((a, b) => savedOrder.indexOf(a.id) - savedOrder.indexOf(b.id))
            : activeWidgetConfigs;

        grid.innerHTML = orderedConfigs.map(config => createWidget(config)).join('');
        this.renderCharts(orderedConfigs);
    }

    _composeDashboardData() {
        return {
            recentMembers: this.dataStore.getRecentMembers(5),
            upcomingAppointments: this.dataStore.getUpcomingAppointments(5),
            openInvoices: this.dataStore.getOpenInvoices(),
            gymOccupancy: this.dataStore.getGymOccupancy(),
            memberStats: this.dataStore.getMemberStats(),
            trainerPerformance: this.dataStore.getTrainerPerformance(),
            recentActivityLogs: this.dataStore.getWorkoutLogs({ limit: 10, sort: 'desc' }),
        };
    }

    _getWidgetContext() {
        return {
            memberManagementState: dashboardState.memberManagementState,
            employeeManagementState: dashboardState.employeeManagementState,
            bluetoothState: {
                state: this.app.bluetoothService.getState(),
                deviceName: this.app.bluetoothService.getDevice()?.name
            },
            members: this.dataStore.getMembers(),
            employees: this.dataStore.getEmployees(),
            hrvAnalysisResult: dashboardState.hrvAnalysisResult,
            t: this.localizationService.t.bind(this.localizationService),
            view: this
        };
    }

    renderCharts(widgetConfigs) {
        widgetConfigs.forEach(config => {
            if (config.chart) {
                const chartContainer = this.container.querySelector(`#${config.id} .widget-content`);
                if (chartContainer) {
                    // this.app.chartRenderer.render(chartContainer, config.chart.type, config.chart.data, config.chart.options);
                }
            }
        });
    }

    addEventListeners(container) {
        addDashboardEventListeners(this, container);
    }

    updateSingleWidget(widgetId) {
        updateSingleWidget(this, widgetId);
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

    async showWidgetConfigModal() {
        const t = this.localizationService.t.bind(this.localizationService);
        const allWidgetConfigs = buildWidgetConfig(this._composeDashboardData(), this._getWidgetContext());
        const currentConfig = this.app.settings.get('dashboardWidgets', allWidgetConfigs.map(w => w.id));

        const body = `
            <p class="mb-4">${t('dashboard.configModal.description')}</p>
            <div class="grid grid-cols-2 gap-4">
                ${allWidgetConfigs.map(widget => `
                    <label class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                        <input type="checkbox" class="form-checkbox h-5 w-5 text-blue-600" data-widget-id="${widget.id}" ${currentConfig.includes(widget.id) ? 'checked' : ''}>
                        <span class="text-gray-800 dark:text-gray-200">${t(widget.title)}</span>
                    </label>
                `).join('')}
            </div>
        `;

        const confirmed = await this.uiManager.showConfirmation(t('dashboard.configureWidgets'), body);

        if (confirmed) {
            const selectedWidgets = Array.from(this.uiManager.modal.querySelectorAll('input[type="checkbox"]:checked'))
                .map(input => input.dataset.widgetId);
            this.app.settings.set('dashboardWidgets', selectedWidgets);
            this.uiManager.showNotification(t('dashboard.configModal.saved'), 'success');
            this.render(this.container);
        }
    }

    _handleIceSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        console.log('ICE Search:', searchTerm);
    }

    async handleDashboardRrUpload(file) {
        this.uiManager.showLoading('Analyzing HRV data...');
        try {
            const result = await this.app.hrvService.analyzeRrIntervals(file);
            dashboardState.hrvAnalysisResult = result;
            this.updateSingleWidget('hrv-analysis');
            this.uiManager.showNotification('HRV analysis complete.', 'success');
        } catch (error) {
            console.error('Error analyzing HRV data:', error);
            this.uiManager.showNotification(`Error: ${error.message}`, 'error');
        } finally {
            this.uiManager.hideLoading();
        }
    }

    showAgeCategoryModal(category) {
        const members = this.dataStore.getMembersByAgeCategory(category);
        const t = this.localizationService.t.bind(this.localizationService);
        const title = `${t('dashboard.memberDistribution.title')}: ${category}`;
        const body = `
            <ul>
                ${members.map(m => `<li>${m.name}</li>`).join('')}
            </ul>
        `;
        this.uiManager.showAlert(title, body);
    }

    showTrainerRatingsModal(trainerId) {
        const trainer = this.dataStore.getEmployeeById(trainerId);
        const ratings = this.dataStore.getRatingsForTrainer(trainerId);
        const t = this.localizationService.t.bind(this.localizationService);
        const title = `${t('dashboard.trainerPerformance.ratingsFor')} ${trainer.name}`;
        const body = `
            <p>Average Rating: ${ratings.average.toFixed(2)}</p>
            <ul>
                ${ratings.comments.map(c => `<li>\"${c.comment}\" - ${c.rating} stars</li>`).join('')}
            </ul>
        `;
        this.uiManager.showAlert(title, body);
    }

    destroy() {
        if (this.boundBluetoothHandler) {
            this.app.bluetoothService.off('connectionStateChange', this.boundBluetoothHandler);
            this.boundBluetoothHandler = null;
        }
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}