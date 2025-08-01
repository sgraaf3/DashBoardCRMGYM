export default class SettingsView {
    constructor(app) {
        this.app = app;
    }

    render(container) {
        const t = this.app.localizationService.t.bind(this.app.localizationService);
        container.innerHTML = `
            <div class="view-header">
                <h1>${t('settings.title', 'Settings')}</h1>
            </div>
            <p class="view-subheader">${t('settings.description', 'Manage application and user settings.')}</p>
            <div class="settings-grid">
                <div class="widget">
                    <h3>${t('settings.account.title', 'Account')}</h3>
                    <ul class="widget-list">
                        <li><a href="#/profile-settings">${t('settings.account.profile', 'Edit Profile')}</a></li>
                    </ul>
                </div>
                <div class="widget">
                    <h3>${t('settings.application.title', 'Application')}</h3>
                    <ul class="widget-list">
                        <li><a href="#/general-settings">${t('settings.application.general', 'General Settings')}</a></li>
                        <li><a href="#/settings/invoice-templates">${t('settings.application.invoiceTemplates', 'Invoice Templates')}</a></li>
                    </ul>
                </div>
                <div class="widget">
                    <h3>${t('settings.gym.title', 'Gym Management')}</h3>
                    <ul class="widget-list">
                        <li><a href="#/settings/rooms">${t('settings.gym.rooms', 'Room Management')}</a></li>
                        <li><a href="#/settings/lessons">${t('settings.gym.lessons', 'Lesson Schedule')}</a></li>
                    </ul>
                </div>
            </div>
        `;
    }

    destroy() {}
}