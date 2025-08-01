let notificationsEnabled = true;

/**
 * Updates the module's internal state for enabling or disabling notifications.
 * @param {boolean} enabled - Whether notifications should be shown.
 */
export function setNotificationsEnabled(enabled) {
    notificationsEnabled = enabled;
}

/**
 * Displays a pop-up notification message.
 * @param {string} message - The message to display.
 * @param {'success'|'error'} [type='success'] - The type of notification.
 */
export function showNotification(message, type = 'success') {
    if (!notificationsEnabled) return;
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-times-circle';
    notification.innerHTML = `<i class="fas ${iconClass}"></i><span>${message}</span>`;
    container.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}