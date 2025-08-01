class EnergyControlDashboardView {
    constructor(app) { this.app = app; }
    render(container) {
        container.innerHTML = `
            <div class="sub-view-header">
                <h2>Energy Control Dashboard</h2>
                <p>Monitor real-time energy expenditure and recovery metrics.</p>
            </div>
            <div class="sub-view-body"><p>Feature coming soon. Requires live sensor data.</p></div>
        `;
    }
}

export default EnergyControlDashboardView;