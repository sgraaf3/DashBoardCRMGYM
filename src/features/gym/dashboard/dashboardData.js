export function getDashboardData(dataStore) {
    const workoutLogs = dataStore.getWorkoutLogs();
    const scheduledWorkouts = dataStore.getScheduledWorkouts();
    const members = dataStore.getMembers();
    const workoutSchemas = dataStore.getWorkoutSchemas();

    // Sort workout logs by date, newest first
    const recentActivity = workoutLogs
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5); // Get top 5 recent activities

    const recentActivityHtml = recentActivity.length > 0 ? recentActivity.map(log => {
        const member = members.find(m => m.id === log.userId);
        const schema = workoutSchemas.find(s => s.id === log.schemaId);
        const date = new Date(log.date).toLocaleDateString();
        return `<li><strong>${member ? member.name : 'Unknown Member'}</strong> completed <strong>${schema ? schema.name : 'a workout'}</strong> on ${date}</li>`;
    }).join('') : '<li>No recent activity.</li>';

    // Filter and sort upcoming sessions
    const upcomingSessions = scheduledWorkouts
        .filter(session => new Date(session.date) >= new Date()) // Only future sessions
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5); // Get top 5 upcoming sessions

    const upcomingSessionsHtml = upcomingSessions.length > 0 ? upcomingSessions.map(session => {
        const member = members.find(m => m.id === session.memberId);
        const schema = workoutSchemas.find(s => s.id === session.schemaId);
        const sessionDate = new Date(session.date);
        const today = new Date();
        let dateDisplay;
        if (sessionDate.toDateString() === today.toDateString()) {
            dateDisplay = 'Today';
        } else if (sessionDate.toDateString() === new Date(today.setDate(today.getDate() + 1)).toDateString()) {
            dateDisplay = 'Tomorrow';
        } else {
            dateDisplay = sessionDate.toLocaleDateString();
        }
        return `<li><strong>${dateDisplay}:</strong> ${member ? member.name : 'Unknown Member'} - ${schema ? schema.name : 'Unknown Workout'}</li>`;
    }).join('') : '<li>No upcoming sessions.</li>';

    return { recentActivityHtml, upcomingSessionsHtml };
}