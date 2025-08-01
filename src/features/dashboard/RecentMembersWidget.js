/**
 * @class RecentmembersWidget
 * @description A dashboard widget that displays the most recently joined members.
 */
export default class RecentmembersWidget {
    constructor(dataStore) {
        this.dataStore = dataStore;
    }

    async render(container) {
        const recentmembers = await this.dataStore.getRecentmembers(5);

        const listItems = recentmembers.map(member => `
            <li>
                <a href="#crm/members/${member.id}">${member.name}</a>
                <span>${member.joinDate}</span>
            </li>
        `).join('');

        container.innerHTML = `
            <div class="widget">
                <h3>Recent members</h3>
                <ul class="widget-list">
                    ${listItems || '<li>No recent members found.</li>'}
                </ul>
            </div>
        `;
    }
}