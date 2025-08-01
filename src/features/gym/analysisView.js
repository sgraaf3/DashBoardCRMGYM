import EnergyControlDashboardView from './energyControlDashboardView.js';
import HrvLoggingView from './hrvLoggingView.js';
import LiveTrainingUIView from './liveTrainingUIView.js';
import PoseCorrectionView from './poseCorrectionView.js';

class AnalysisView {
    constructor(app) {
        this.app = app;
        this.subViews = {
            energy: new EnergyControlDashboardView(app),
            hrv: new HrvLoggingView(app),
            live: new LiveTrainingUIView(app),
            pose: new PoseCorrectionView(app),
        };
    }
    render(container, model = null, pathParts) {
        const [subViewId = 'energy'] = pathParts;
        container.innerHTML = `
            <div class="view-header"><h1>Bio-Analysis Lab</h1></div>
            <nav class="sub-nav">
                <a href="#/analysis/energy" class="sub-nav-item ${subViewId === 'energy' ? 'active' : ''}">Energy Control</a>
                <a href="#/analysis/hrv" class="sub-nav-item ${subViewId === 'hrv' ? 'active' : ''}">HRV Logging</a>
                <a href="#/analysis/live" class="sub-nav-item ${subViewId === 'live' ? 'active' : ''}">Live Feedback</a>
                <a href="#/analysis/pose" class="sub-nav-item ${subViewId === 'pose' ? 'active' : ''}">Pose Correction</a>
            </nav>
            <div id="analysis-content" class="view-body"></div>
        `;
        const subView = this.subViews[subViewId];
        if (subView) {
            subView.render(container.querySelector('#analysis-content'));
        } else {
            this.subViews.energy.render(container.querySelector('#analysis-content'));
        }
    }
}

export default AnalysisView;