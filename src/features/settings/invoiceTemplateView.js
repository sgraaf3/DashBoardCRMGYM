class InvoiceTemplateView {
    constructor(app) {
        this.app = app;
        this.template = {};
    }

    init() {
        // Fetch the template directly from the dataStore. It's synchronous.
        this.template = this.app.dataStore.getInvoiceTemplate('default') || {};
    }

    render(container, model = null) {
        this.init();
        const t = this.app.localizationService.t.bind(this.app.localizationService);
        const [address1 = '', address2 = ''] = (this.template.companyAddress || '').split('\n');
            container.innerHTML = `
                <div class="view-header">
                    <h1>${t('settings.invoiceTemplate.title', 'Invoice Template')}</h1>
                    <div class="view-header-actions">
                        <a href="#/settings" class="btn btn-secondary">Back to Settings</a>
                    </div>
                </div>
                <div class="settings-grid">
                    <div class="widget">
                        <h3>${t('settings.invoiceTemplate.editor', 'Template Editor')}</h3>
                        <form id="invoice-template-form">
                            <div class="form-group">
                                <label for="template-logo-url">${t('settings.invoiceTemplate.logoUrl', 'Logo URL')}</label>
                                <input type="text" id="template-logo-url" class="form-control" value="${this.template.companyLogo || ''}">
                                <p class="note">${t('settings.invoiceTemplate.logoNote', 'Enter a URL to an image. Recommended size: 300x100px.')}</p>
                            </div>
                            <div class="form-group">
                                <label for="template-company-name">${t('settings.invoiceTemplate.companyName', 'Company Name')}</label>
                                <input type="text" id="template-company-name" class="form-control" value="${this.template.companyName || ''}">
                            </div>
                            <div class="form-group">
                                <label for="template-company-address1">${t('settings.invoiceTemplate.address1', 'Address Line 1')}</label>
                                <input type="text" id="template-company-address1" class="form-control" value="${address1}">
                            </div>
                             <div class="form-group">
                                <label for="template-company-address2">${t('settings.invoiceTemplate.address2', 'Address Line 2')}</label>
                                <input type="text" id="template-company-address2" class="form-control" value="${address2}">
                            </div>
                            <div class="form-group">
                                <label for="template-footer-text">${t('settings.invoiceTemplate.footerText', 'Footer Text')}</label>
                                <input type="text" id="template-footer-text" class="form-control" value="${this.template.footerText || ''}">
                            </div>
                            <div class="form-group">
                                <label for="template-primary-color">${t('settings.invoiceTemplate.primaryColor', 'Primary Color')}</label>
                                <input type="color" id="template-primary-color" class="form-control" value="${this.template.paymentTerms || '#4A90E2'}">
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">${t('common.saveChanges', 'Save Changes')}</button>
                            </div>
                        </form>
                    </div>
                    <div class="widget">
                        <h3>${t('settings.invoiceTemplate.preview', 'Live Preview')}</h3>
                        <div id="invoice-preview-container"></div>
                    </div>
                </div>
            `;
            this.addEventListeners();
            this.updatePreview();
    }

    addEventListeners() {
        const form = document.getElementById('invoice-template-form');
        form.addEventListener('submit', e => this.handleSave(e));
        form.addEventListener('input', () => this.updatePreview());
    }

    async handleSave(e) {
        e.preventDefault();
        const updatedTemplate = {
            id: 'default', // Always save to the default template
            companyLogo: document.getElementById('template-logo-url').value,
            companyName: document.getElementById('template-company-name').value,
            companyAddress: `${document.getElementById('template-company-address1').value}\n${document.getElementById('template-company-address2').value}`.trim(),
            footerText: document.getElementById('template-footer-text').value,
            paymentTerms: document.getElementById('template-primary-color').value, // This field was mislabeled in the original HTML
        };
        // Use the dataStore to save the template
        await this.app.dataStore.saveInvoiceTemplate(updatedTemplate);
        this.app.uiManager.showNotification(this.app.localizationService.t('settings.invoiceTemplate.saved', 'Invoice template saved successfully!'), 'success');
    }

    updatePreview() {
        const previewContainer = document.getElementById('invoice-preview-container');
        const template = {
            logoUrl: document.getElementById('template-logo-url').value,
            companyName: document.getElementById('template-company-name').value,
            companyAddress: `${document.getElementById('template-company-address1').value}<br>${document.getElementById('template-company-address2').value}`,
            footerText: document.getElementById('template-footer-text').value,
            primaryColor: document.getElementById('template-primary-color').value,
        };

        previewContainer.innerHTML = `
            <div style="border: 1px solid #ccc; padding: 20px; font-family: sans-serif; font-size: 12px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="width: 50%;">
                            ${template.logoUrl ? `<img src="${template.logoUrl}" alt="logo" style="max-width: 150px; max-height: 50px; object-fit: contain;">` : `<h3>${template.companyName}</h3>`}
                        </td>
                        <td style="width: 50%; text-align: right;">
                            <h2 style="color: ${template.primaryColor}; margin: 0;">INVOICE</h2>
                            <p style="margin: 0;">#12345</p>
                        </td>
                    </tr>
                </table>
                <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #777;">${template.footerText}</div>
            </div>
        `;
    }
}

export default InvoiceTemplateView;