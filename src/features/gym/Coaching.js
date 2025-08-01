

/**
 * @class Coaching
 * @description Main view for the coaching section, handling workout plans,
 *              member assignments, and progress tracking.
 */
import WorkoutPlanner from '../workout/workoutPlanner.js';
import MemberProgressView from '../progress/memberProgressView.js';
import CoachingDashboardView from './coachingDashboardView.js';
import uIManager from '../services/uiManager.js';

export default class Coaching {
    constructor(app) {
        this.app = app;
        this.container = null;
        this.activeSubView = null;

        // These views now get their own dependencies
        this.dashboardView = new CoachingDashboardView(app);
        this.workoutPlanner = new WorkoutPlanner(app);
        this.memberProgress = new MemberProgressView(app);
    }

    /**
     * Renders the coaching view, potentially routing to sub-views.
     * @param {HTMLElement} container - The container to render into.
     * @param {string[]} pathParts - The parts of the URL path for sub-routing.
     */
    render(container, pathParts = []) {
        this.container = container;
        uIManager.hideModal?.();

        const [subViewId = 'dashboard'] = pathParts;

        this.container.innerHTML = `
            <div class="view-header">
                <h1>Coaching Dashboard</h1>
            </div>
            <nav class="sub-nav">
                <a href="#/coaching/dashboard" class="sub-nav-item" data-subview="dashboard">Dashboard</a>
                <a href="#/coaching/planner" class="sub-nav-item" data-subview="planner">Workout Planner</a>
                <a href="#/coaching/progress" class="sub-nav-item" data-subview="progress">member Progress</a>
            </nav>
            <div id="coaching-content" class="view-body">
                <!-- Sub-view content will be rendered here -->
            </div>
        `;

        this.renderSubView(subViewId);
    }

    renderSubView(subViewId) {
        const contentContainer = this.container.querySelector('#coaching-content');
        contentContainer.innerHTML = ''; // Clear previous content

        // Update active tab
        this.container.querySelectorAll('.sub-nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.subview === subViewId);
        });

        switch (subViewId) {
            case 'planner':
                this.workoutPlanner.render(contentContainer);
                this.activeSubView = this.workoutPlanner;
                break;
            case 'progress':
                this.memberProgress.render(contentContainer);
                this.activeSubView = this.memberProgress;
                break;
            case 'dashboard':
            default:
                this.dashboardView.render(contentContainer);
                this.activeSubView = this.dashboardView;
                break;
        }
    }

    /**
     * In this architecture, the main router handles hash changes, so we don't need
     * to add click listeners to the nav items here.
     */

    destroy() {
        // In the future, if sub-views have their own event listeners, we'd call their destroy methods here.
        console.log('Coaching view destroyed');
    }
}