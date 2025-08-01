

class EnergyControlDashboardView {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'energy-control-dashboard-view';
        this.graphComponent = null;
    }

    async render(mainContentEl) {
        this.container.innerHTML = `
            <div class="view-header">
                <h1>${LocalizationService.t('energyControl.title')}</h1>
            </div>
            <div class="view-body">
                <p>${LocalizationService.t('energyControl.description')}</p>
                <div id="hrv-history-chart" style="width: 100%; height: 300px;"></div>
                <div id="readiness-score"></div>
            </div>
        `;
        mainContentEl.appendChild(this.container);
        await this.loadEnergyControlData();
    }

    async loadEnergyControlData() {
        const hrvChartEl = this.container.querySelector('#hrv-history-chart');
        const readinessScoreEl = this.container.querySelector('#readiness-score');

        hrvChartEl.innerHTML = '<p>Loading HRV history...</p>';
        readinessScoreEl.innerHTML = '<p>Loading readiness score...</p>';

        try {
            const hrvData = await apiService.get('/api/hrv-history.json');
            const readinessScore = await apiService.get('/api/energy-readiness.json');

            if (hrvData.length > 0) {
                const graphData = hrvData.map((d, i) => ({
                    x: i,
                    y: d.hrvValue
                }));
                this.graphComponent = new GraphingComponent('hrv-history-chart');
                this.graphComponent.render(graphData, { xLabel: 'Measurement', yLabel: 'HRV Value' });
            } else {
                hrvChartEl.innerHTML = '<p>No HRV data available.</p>';
            }

            readinessScoreEl.innerHTML = `
                <h3>Readiness Score: ${readinessScore.score}</h3>
                <p>${readinessScore.message}</p>
            `;

        } catch (error) {
            console.error('Error loading energy control data:', error);
            hrvChartEl.innerHTML = '<p>Error loading HRV history.</p>';
            readinessScoreEl.innerHTML = '<p>Error loading readiness score.</p>';
        }
    }

    destroy() {
        this.container.innerHTML = '';
    }
}

export default EnergyControlDashboardView;
