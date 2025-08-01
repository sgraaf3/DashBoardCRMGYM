/**
 * @class memberProgress
 * @description Sub-view for tracking the progress of assigned members.
 */
export default class memberProgress {
    constructor(dataStore, uIManager) {
        this.dataStore = dataStore;
        this.uIManager = uIManager;
    }

    render(container) {
        container.innerHTML = `
            <div class="sub-view-header">
                <h2>member Progress</h2>
                <p>Review member adherence and performance over time.</p>
            </div>
            <div class="sub-view-body"><p>Feature coming soon.</p></div>
        `;
    }
}