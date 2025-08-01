class LiveTrainingUIView {
    constructor(app) { this.app = app; }
    render(container) {
        container.innerHTML = `
            <div class="sub-view-header">
                <h2>Live Training UI</h2>
                <p>Real-time bio-feedback during a workout session.</p>
            </div>
            <div class="sub-view-body"><p>Feature coming soon. Requires live sensor data and HRV analysis module.</p></div>
        `;
    }
}

export default LiveTrainingUIView;