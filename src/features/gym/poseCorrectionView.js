class PoseCorrectionView {
    constructor(app) { this.app = app; }
    render(container) {
        container.innerHTML = `
            <div class="sub-view-header">
                <h2>Pose Correction</h2>
                <p>Get real-time feedback on your exercise form.</p>
            </div>
            <div class="sub-view-body"><p>Feature coming soon. Requires camera access and a pose-detection model.</p></div>
        `;
    }
}

export default PoseCorrectionView;