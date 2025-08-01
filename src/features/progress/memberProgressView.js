class MemberProgressView {
    constructor(app) {
        this.app = app;
    }

    render(container) {
        container.innerHTML = `
            <div class="sub-view-header">
                <h2>Member Progress</h2>
                <p>Review member adherence and performance over time.</p>
            </div>
            <div class="sub-view-body"><p>Feature coming soon.</p></div>
        `;
    }
}

export default MemberProgressView;