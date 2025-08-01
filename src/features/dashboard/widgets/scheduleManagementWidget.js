export function createScheduleManagementWidget(data, context) {
    const { t, scheduledWorkouts = [], members = [], schemas = [] } = data;
    const todayStr = new Date().toISOString().split('T')[0];

    const todayWorkouts = (scheduledWorkouts || [])
        .filter(w => w.date === todayStr)
        .map(w => {
            const member = members.find(m => m.id === w.memberId);
            const schema = schemas.find(s => s.id === w.schemaId);
            return `
                <tr>
                    <td>${member ? member.name : 'N/A'}</td>
                    <td>${schema ? schema.name : 'N/A'}</td>
                    <td class="actions">
                        <a href="#/workout-planner" data-prefill-user="${member.id}" data-prefill-date="${w.date}" class="btn-icon" title="Go to Planner">&#128197;</a>
                    </td>
                </tr>
            `;
        }).join('');

    return {
        id: 'schedule-management',
        title: t('schedule.title', 'Schedule Management'),
        icon: '🗓️',
        colSpan: 4,
        rowSpan: 2,
        normalContent: `
            <h4>Today's Scheduled Workouts (${todayStr})</h4>
            <table class="activity-table">
                <thead>
                    <tr>
                        <th>Member</th>
                        <th>Workout</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${todayWorkouts || `<tr><td colspan="3">No workouts scheduled for today.</td></tr>`}
                </tbody>
            </table>
            <div class="widget-actions">
                <a href="#/workout-planner" class="btn btn-primary">Open Full Workout Planner</a>
                <a href="#/schedule" class="btn">View Weekly Schedule</a>
            </div>
        `,
    };
}