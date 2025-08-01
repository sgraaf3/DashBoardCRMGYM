

class HrvLoggingView {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'hrv-logging-view';
    }

    async render(mainContentEl) {
        this.container.innerHTML = `
            <div class="view-header">
                <h1>${LocalizationService.t('hrvLogging.title')}</h1>
            </div>
            <div class="view-body">
                <p>${LocalizationService.t('hrvLogging.description')}</p>
                <form id="hrv-log-form">
                    <label for="hrv-value">${LocalizationService.t('hrvLogging.hrvValueLabel')}:</label>
                    <input type="number" id="hrv-value" name="hrvValue" required>
                    <label for="hrv-notes">${LocalizationService.t('hrvLogging.notesLabel')}:</label>
                    <textarea id="hrv-notes" name="notes"></textarea>
                    <button type="submit">${LocalizationService.t('hrvLogging.logButton')}</button>
                </form>
                <div id="hrv-log-status"></div>
            </div>
        `;
        mainContentEl.appendChild(this.container);
        this.addEventListeners();
    }

    addEventListeners() {
        const form = this.container.querySelector('#hrv-log-form');
        form.addEventListener('submit', this.handleLogSubmit.bind(this));
    }

    async handleLogSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const hrvValue = form['hrv-value'].value;
        const notes = form['hrv-notes'].value;
        const statusEl = this.container.querySelector('#hrv-log-status');

        if (!hrvValue) {
            statusEl.textContent = 'Please enter an HRV value.';
            return;
        }

        try {
            // Assuming an API endpoint for logging HRV data
            const response = await api.post('/api/hrv/log', { hrvValue: parseFloat(hrvValue), notes });
            if (response.ok) {
                statusEl.textContent = 'HRV data logged successfully!';
                form.reset();
            } else {
                statusEl.textContent = 'Failed to log HRV data.';
            }
        } catch (error) {
            console.error('Error logging HRV data:', error);
            statusEl.textContent = 'Error logging HRV data. Please try again.';
        }
    }

    destroy() {
        const form = this.container.querySelector('#hrv-log-form');
        if (form) {
            form.removeEventListener('submit', this.handleLogSubmit.bind(this));
        }
        this.container.innerHTML = '';
    }
}

export default HrvLoggingView;
