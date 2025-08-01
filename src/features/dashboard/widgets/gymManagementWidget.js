export function createGymManagementWidget(data, context) {
    const { t, schemas = [], gymOccupancy = { roomDetails: [] } } = data;

    const schemaList = (schemas || []).slice(0, 5).map(s => `
        <li class="clickable" data-action="edit-schema" data-schema-id="${s.id}">
            <span>${s.name}</span>
            <span class="note">${s.exercises.length} exercises</span>
        </li>
    `).join('');

    const roomList = (gymOccupancy.roomDetails || []).map(room => `
        <tr>
            <td>${room.name}</td>
            <td><span class="status status-${room.status.toLowerCase()}">${room.status}</span></td>
            <td>${room.occupants.length} / ${room.capacity}</td>
        </tr>
    `).join('');

    return {
        id: 'gym-management',
        title: t('gym.title', 'Gym Management'),
        icon: '🏋️',
        colSpan: 4,
        rowSpan: 2,
        normalContent: `
            <div class="financial-details-grid">
                <div>
                    <h4>Workout Schemas</h4>
                    <ul class="widget-list">
                        ${schemaList || '<li>No schemas created yet.</li>'}
                    </ul>
                    <div class="widget-actions" style="justify-content: flex-start; margin-top: 1rem;">
                         <a href="#/gym/schemas/add" class="btn btn-sm">${t('gym.createSchema', 'Create New Schema')}</a>
                         <a href="#/gym" class="btn btn-sm">View All Schemas</a>
                    </div>
                </div>
                <div>
                    <h4>Live Room Occupancy</h4>
                     <table class="activity-table">
                        <thead><tr><th>Room</th><th>Status</th><th>Occupancy</th></tr></thead>
                        <tbody>${roomList}</tbody>
                    </table>
                </div>
            </div>
        `,
    };
}