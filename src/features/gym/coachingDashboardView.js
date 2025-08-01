import { getDashboardData } from './dashboard/dashboardData.js';
import { getDashboardTemplate } from './dashboard/dashboardTemplate.js';
import { addDashboardEventListeners } from './dashboard/dashboardEventListeners.js';

export default class CoachingDashboardView {
    constructor(app) {
        this.app = app;
    }

    render(container) {
        const { recentActivityHtml, upcomingSessionsHtml } = getDashboardData(this.app.dataStore);


        container.innerHTML = getDashboardTemplate(recentActivityHtml, upcomingSessionsHtml);
        addDashboardEventListeners(container, this.app);
    }
}
