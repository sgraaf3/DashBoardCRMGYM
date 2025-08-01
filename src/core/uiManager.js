class UIManager {
    constructor(authManager, stylingManager, localizationService) {
        this.authManager = authManager;
        this.stylingManager = stylingManager;
        this.localizationService = localizationService;
        this.modalBackdrop = document.getElementById('modal-backdrop');
        this.modalContent = document.getElementById('modal-content');
        this.modalBody = document.getElementById('modal-body');
        this.modalTitle = document.getElementById('modal-title');

        this.modalBackdrop.addEventListener('click', (e) => {
            if (e.target === this.modalBackdrop || e.target.classList.contains('modal-close-button')) this.hideModal();
        });
    }

    // updateShell, renderAuthenticatedHeader, and renderSidebar are removed as per user request

    showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        container.appendChild(notification);

        void notification.offsetWidth;

        notification.classList.add('show');

        setTimeout(() => { notification.classList.remove('show'); setTimeout(() => notification.remove(), 500); }, duration);
    }

    showModal(title, bodyHtml, onRenderedCallback = null) {
        this.modalTitle.textContent = title;
        this.modalBody.innerHTML = bodyHtml;
        this.modalBackdrop.style.display = 'flex';
        if (onRenderedCallback) {
            requestAnimationFrame(onRenderedCallback);
        }
    }

    hideModal() {
        this.modalBackdrop.style.display = 'none';
        this.modalBody.innerHTML = '';
    }

    /**
     * Attaches a persistent save callback to the primary button in the currently open modal.
     * This is for modals that act like forms and shouldn't close immediately on save.
     * @param {Function} callback - The function to execute when the save button is clicked.
     */
    setModalSaveCallback(callback) {
        const saveBtn = this.modalContent.querySelector('.btn-primary');
        if (saveBtn) {
            // Replace the button to remove any old listeners, preventing duplicates
            const newBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newBtn, saveBtn);
            newBtn.addEventListener('click', callback);
        }
    }

    // Alias for hideModal to match usage in some components
    closeModal = () => this.hideModal();
    

    showConfirmation(title, message) {
        return new Promise((resolve) => {
            const bodyHtml = `
                <p>${message}</p>
                <div class="modal-actions">
                    <button id="confirm-cancel-btn" class="btn">Cancel</button>
                    <button id="confirm-ok-btn" class="btn btn-danger">OK</button>
                </div>
            `;
            this.showModal(title, bodyHtml, () => {
                const okBtn = this.modalBody.querySelector('#confirm-ok-btn');
                const cancelBtn = this.modalBody.querySelector('#confirm-cancel-btn');

                if (okBtn && cancelBtn) {
                    okBtn.onclick = () => { this.hideModal(); resolve(true); };
                    cancelBtn.onclick = () => { this.hideModal(); resolve(false); };
                } else {
                    console.error('Confirmation buttons NOT found in DOM.');
                    resolve(false); // Resolve with false if buttons are not found
                }
            });
        });
    }
}

export default UIManager;