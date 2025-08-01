// src/features/testing/testingView.js
import LocalizationService from '../services/localizationServices.js';
import apiService from '../../services/api.js';
import GraphingComponent from '../../components/graphingComponent.js';

class TestingView {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'testing-view';
        this.graphComponent = null; // To hold the instance of GraphingComponent
    }

    render(mainContentEl) {
        this.container.innerHTML = `
            <div class="view-header">
                <h1>${LocalizationService.t('testing.title')}</h1>
                <p>${LocalizationService.t('testing.description')}</p>
            </div>
            <div class="view-body">
                <div class="test-category-grid">
                    <div class="test-category-card" data-test="strength"><h3>${LocalizationService.t('testing.strength')}</h3></div>
                    <div class="test-category-card" data-test="flexibility"><h3>${LocalizationService.t('testing.flexibility')}</h3></div>
                    <div class="test-category-card" data-test="speed"><h3>${LocalizationService.t('testing.speed')}</h3></div>
                    <div class="test-category-card" data-test="endurance"><h3>${LocalizationService.t('testing.endurance')}</h3></div>
                    <div class="test-category-card" data-test="coordination"><h3>${LocalizationService.t('testing.coordination')}</h3></div>
                    <div class="test-category-card" data-test="reaction"><h3>${LocalizationService.t('testing.reaction')}</h3></div>
                </div>
                <div class="view-actions">
                    <button class="button-secondary" data-action="view-results">${LocalizationService.t('testing.viewResults')}</button>
                </div>
                <div id="test-results-graph" style="width: 100%; height: 300px;"></div>
            </div>
        `;
        mainContentEl.appendChild(this.container);
        this.addEventListeners();
        this.loadAndRenderGraph();
    }

    addEventListeners() {
        // Future: this.container.addEventListener('click', this.handleCardClick.bind(this));
    }

    async loadAndRenderGraph() {
        try {
            const testResults = await apiService.get('/api/test-results.json');
            console.log('Fetched test results:', testResults);

            // Assuming testResults is an array of objects like { date: "YYYY-MM-DD", value: X }
            // Transform data for the graphing component (x: date index, y: value)
            const graphData = testResults.map((result, index) => ({
                x: index,
                y: result.value
            }));

            this.graphComponent = new GraphingComponent('test-results-graph');
            this.graphComponent.render(graphData, { xLabel: 'Test Number', yLabel: 'Result Value' });

        } catch (error) {
            console.error('Error loading test results:', error);
            const graphContainer = document.getElementById('test-results-graph');
            if (graphContainer) {
                graphContainer.innerHTML = '<p style="color: red;">Failed to load test results graph.</p>';
            }
        }
    }

    destroy() {
        this.container.innerHTML = '';
    }
}

export default TestingView;
