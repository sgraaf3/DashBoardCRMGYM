/**
 * Initializes the settings widget functionality.
 * @param {object} dependencies - The dependencies needed for the settings module.
 * @param {function} dependencies.showNotification - Function to show notifications.
 * @param {function} dependencies.setNotificationsEnabled - Function to enable/disable notifications.
 * @param {function} dependencies.getSortableInstance - Function to get the SortableJS instance.
 * @param {function} dependencies.reinitCharts - Function to re-initialize charts.
 * @param {function} dependencies.reinitCalendar - Function to re-initialize the calendar.
 */
export function initSettings(dependencies) {
    const { showNotification, setNotificationsEnabled, getSortableInstance, reinitCharts, reinitCalendar } = dependencies;

    const themeButtons = document.querySelectorAll('.theme-btn');
    const notificationsToggle = document.getElementById('notifications-toggle');
    const kioskModeToggle = document.getElementById('kiosk-mode-toggle');
    const exportBtn = document.getElementById('export-settings-btn');
    const importBtn = document.getElementById('import-settings-btn');
    const importFileInput = document.getElementById('import-file-input');

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('gymcrm-theme', theme);
        themeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.theme === theme));
        // Re-initialize charts and calendar with new theme colors
        reinitCharts();
        reinitCalendar();
    };

    themeButtons.forEach(button => {
        button.addEventListener('click', () => applyTheme(button.dataset.theme));
    });

    notificationsToggle.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        setNotificationsEnabled(isEnabled);
        localStorage.setItem('gymcrm-notifications-enabled', isEnabled);
        showNotification(`Notifications ${isEnabled ? 'Enabled' : 'Disabled'}.`);
    });

    const applyKioskMode = (enabled) => {
        document.documentElement.setAttribute('data-kiosk-mode', enabled);
        if (getSortableInstance()) {
            getSortableInstance().option('disabled', enabled);
        }
        localStorage.setItem('gymcrm-kiosk-mode', enabled);
    };

    kioskModeToggle.addEventListener('change', (e) => {
        const isKiosk = e.target.checked;
        applyKioskMode(isKiosk);
        showNotification(`Kiosk Mode ${isKiosk ? 'Enabled' : 'Disabled'}.`);
    });

    // Export functionality
    exportBtn.addEventListener('click', () => {
        const settingsToExport = {};
        const keysToExport = ['gymcrm-theme', 'gymcrm-notifications-enabled', 'gymcrm-kiosk-mode', 'gymcrm-widget-order', 'gymcrm-widget-sizes'];
        
        keysToExport.forEach(key => {
            const value = localStorage.getItem(key);
            if (value !== null) {
                settingsToExport[key] = value;
            }
        });

        const blob = new Blob([JSON.stringify(settingsToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gymcrm-settings-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Settings exported successfully.');
    });

    // Import functionality
    importBtn.addEventListener('click', () => {
        importFileInput.click();
    });

    importFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const settings = JSON.parse(e.target.result);
            Object.keys(settings).forEach(key => {
                localStorage.setItem(key, settings[key]);
            });
            showNotification('Settings imported. Reloading...');
            setTimeout(() => window.location.reload(), 1500);
        };
        reader.readAsText(file);
    });

    // Load saved settings
    const savedTheme = localStorage.getItem('gymcrm-theme') || 'dark-mono';
    const savedNotifications = localStorage.getItem('gymcrm-notifications-enabled') !== 'false';
    const savedKioskMode = localStorage.getItem('gymcrm-kiosk-mode') === 'true';
    
    applyTheme(savedTheme);
    setNotificationsEnabled(savedNotifications);
    applyKioskMode(savedKioskMode);
    
    notificationsToggle.checked = savedNotifications;
    kioskModeToggle.checked = savedKioskMode;
}