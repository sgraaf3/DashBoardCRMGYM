class HrvLoggingView {
    constructor(app) { this.app = app; }
    render(container) {
        container.innerHTML = `
            <div class="sub-view-header">
                <h2>HRV Logging</h2>
                <p>Manually log Heart Rate Variability (HRV) readings.</p>
            </div>
            <div class="sub-view-body"><p>Feature coming soon.</p></div>
        `;
    }
}

export default HrvLoggingView;