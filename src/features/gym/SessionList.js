/**
 * @class SessionList
 * @description Renders a list of available live training sessions.
 */
export default class SessionList {
    constructor(dataStore) {
        this.dataStore = dataStore;
    }

    async render(container) {
        const sessions = await this.dataStore.getLiveSessions();

        if (!sessions || sessions.length === 0) {
            container.innerHTML = '<h2>No upcoming sessions. Please check back later.</h2>';
            return;
        }

        const sessionCardsHTML = sessions.map(session => `
            <div class="session-card">
                <h3>${session.title}</h3>
                <p><strong>Trainer:</strong> ${session.trainer}</p>
                <p><strong>Time:</strong> ${session.time}</p>
                <div class="session-card-footer">
                    <span>${session.spotsLeft} / ${session.capacity} spots left</span>
                    <button class="btn btn-primary join-session-btn" data-session-id="${session.id}">Join Session</button>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="view-header">
                <h1>Live Training Sessions</h1>
            </div>
            <div class="session-grid">
                ${sessionCardsHTML}
            </div>
        `;

        this.attachEventListeners(container);
    }

    attachEventListeners(container) {
        container.addEventListener('click', event => {
            if (event.target.classList.contains('join-session-btn')) {
                const sessionId = event.target.dataset.sessionId;
                console.log(`Joining session ${sessionId}...`);
                alert(`Joining session ${sessionId}! (Functionality to be implemented)`);
            }
        });
    }
}