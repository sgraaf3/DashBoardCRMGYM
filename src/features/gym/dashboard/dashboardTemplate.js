export function getDashboardTemplate(recentActivityHtml, upcomingSessionsHtml) {
    return `
        <div class="view-header">
            <h1>Coaching Dashboard</h1>
        </div>
        <div class="dashboard-widgets">
            <div class="widget">
                <h2>Recent Member Activity</h2>
                <p>Display recent activities like completed workouts, new progress logs, etc.</p>
                <ul>
                    ${recentActivityHtml}
                </ul>
            </div>
            <div class="widget">
                <h2>Upcoming Sessions</h2>
                <p>Overview of scheduled coaching sessions.</p>
                <ul>
                    ${upcomingSessionsHtml}
                </ul>
            </div>
            <div class="widget">
                <h2>Quick Actions</h2>
                <button id="create-workout-plan-btn" class="button-primary">Create New Workout Plan</button>
                <button id="add-new-member-btn" class="button-secondary">Add New Member</button>
            </div>
        </div>
    `;
}