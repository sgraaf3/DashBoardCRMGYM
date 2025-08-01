import router from '../../../core/router.js';
import dataStore from '../../../core/dataStore.js';
import UIManager from '../../../core/uiManager.js';
import localizationService from '../../services/localizationServices.js';
import { t } from '../../services/localizationServices.js';

export default class SubscriptionModalView {
    constructor() {


        this.member = null;
    }

    // The router handler will call this.
    render(memberId) {
        // Assuming dataStore methods are synchronous for mock data
        this.member = dataStore.getMemberById(memberId);
        if (!this.member) {
            UIManager.showNotification('Member not found.', 'error');
            // The router handler that calls this should close the modal or not open it.
            // For now, we just notify.
            return;
        }


        const title = t('subscription.manageTitle', 'Manage Subscription for {0}', this.member.name);
        const bodyHtml = this.generateFormHtml();
        const footerHtml = this.createModalFooter();

        UIManager.showModal(title, bodyHtml, null, footerHtml);

        // We need to add event listeners to the modal *after* it's in the DOM.
        this.addModalEventListeners();
        this.addFormEventListeners();
    }

    generateFormHtml() {
        const subscription = this.member.subscription || {};
        // Assuming dataStore methods are synchronous for mock data // In a real app, this would come from dataStore.
        // In a real app, this would come from dataStore.
        const allPlans = [
            { name: 'Basic', price: 25, durationDays: 30 },
            { name: 'Premium', price: 50, durationDays: 30 }
        ];
        const statuses = ['Active', 'Paused', 'Cancelled'];
        const t = this.localizationService.t.bind(this.localizationService);
		
        const planOptions = allPlans.map(plan =>
            `<option value="${plan.name}" data-duration="${plan.durationDays}" ${plan.name === subscription.plan ? 'selected' : ''}>${plan.name} (€${plan.price.toFixed(2)})</option>`
        ).join('');

        const statusOptions = statuses.map(status =>
            `<option value="${status}" ${status === subscription.status ? 'selected' : ''}>${t('subscription.status.' + status.toLowerCase(), status)}</option>`
        ).join('');

        const renewalDate = subscription.renewalDate ? new Date(subscription.renewalDate).toISOString().split('T')[0] : '';

        return `
            <form id="subscription-form" class="modal-form" novalidate>
                <div class="form-group">
                    <label for="sub-plan">${t('subscription.plan', 'Plan')}</label>
                    <select id="sub-plan" name="plan" class="form-control" data-current-plan="${subscription.plan || ''}">${planOptions}</select>
                </div>
                <div class="form-group">
                    <label for="sub-status">${t('common.status', 'Status')}</label>
                    <select id="sub-status" name="status" class="form-control">${statusOptions}</select>
                </div>
                <div class="form-group">
                    <label for="sub-renewal-date">${t('subscription.renewalDate', 'Renewal Date')}</label>
                    <input type="date" id="sub-renewal-date" name="renewalDate" class="form-control" value="${renewalDate}" required>
                    <p class="note">${t('subscription.renewalNote', 'Changing the plan may auto-update the renewal date.')}</p>
                </div>
            </form>
        `;
    }

    createModalFooter() {

        return `
            <button class="btn" data-action="send-reminder">${t('common.sendReminder', 'Send Reminder')}</button>
            <button class="btn btn-secondary" data-action="close-modal">${t('common.cancel', 'Cancel')}</button>
            <button class="btn btn-primary" data-action="save-subscription">${t('common.saveChanges', 'Save Changes')}</button>
        `;
    }
	
    addModalEventListeners() {
        const modal = document.querySelector('.modal'); // Assuming UIManager adds this class
        if (!modal) return;

        modal.addEventListener('click', e => {
            const action = e.target.dataset.action;
            if (action === 'save-subscription') {
                this.handleSave();
            }
            if (action === 'send-reminder') {
                UIManager.showNotification(t('subscription.reminderSent', 'Reminder sent to {0}.', this.member.name), 'info');
            }
            if (action === 'close-modal') {
                UIManager.closeModal();
            }
        });
    }

    addFormEventListeners() {
        const planSelect = document.getElementById('sub-plan');
        const renewalDateInput = document.getElementById('sub-renewal-date');
        if (!planSelect || !renewalDateInput) return;

        planSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const duration = selectedOption.dataset.duration;
            const currentPlan = e.target.dataset.currentPlan;

            // Only update renewal date if the plan has actually changed
            if (duration && e.target.value !== currentPlan) {
                const newRenewalDate = new Date();
                newRenewalDate.setDate(newRenewalDate.getDate() + parseInt(duration, 10));
                renewalDateInput.value = newRenewalDate.toISOString().split('T')[0];
                UIManager.showNotification(localizationService.t('subscription.renewalDateUpdated', 'Renewal date automatically updated based on plan duration.'), 'info');
            }
        });
    }

    async handleSave() {
        const form = document.getElementById('subscription-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const newSubData = Object.fromEntries(formData.entries());

        // This assumes the dataStore holds the member objects and we can modify them.
        // In a real app, this would be an API call.
        this.member.subscription = {
            ...(this.member.subscription || {}),
            ...newSubData
        };

        try {
            // This is a more realistic dataStore method than `updateMemberSubscription`
            await dataStore.saveMember(this.member);
            UIManager.showNotification(t('subscription.updatedSuccess', 'Subscription updated successfully!'), 'success');
            UIManager.closeModal();
            // The view that opened the modal should refresh. The router can handle this.
            router.handleRouteChange();
        } catch (error) {
            console.error('Failed to save subscription:', error);
            UIManager.showNotification(t('errors.saveFailed', 'Failed to save subscription.'), 'error');
        }
    }
}