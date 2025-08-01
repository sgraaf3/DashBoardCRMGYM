
/**
 * @module BillingCycleService
 * @description Manages automated recurring billing cycles.
 */
class BillingCycleService {
    constructor(app) {
        this.app = app;
        this.dataStore = app.dataStore;
        this.timer = null;
        this.isRunning = false;
        this.lastRun = null;
        this.nextRun = null;
        this.runInterval = 24 * 60 * 60 * 1000; // 24 hours
    }

    /**
     * Starts the automated billing cycle.
     */
    start() {
        if (this.isRunning) {
            console.warn('BillingCycleService is already running.');
            return;
        }
        this.isRunning = true;
        console.log('Starting automated billing cycle...');
        this.scheduleNextRun();

        // Run once on start, then schedule
        this.runNow();
    }

    /**
     * Stops the automated billing cycle.
     */
    stop() {
        if (!this.isRunning) {
            console.log('BillingCycleService is not running.');
            return;
        }
        this.isRunning = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.nextRun = null;
        console.log('Stopped automated billing cycle.');
    }

    /**
     * Schedules the next run of the billing cycle.
     */
    scheduleNextRun() {
        if (this.timer) clearInterval(this.timer);
        this.nextRun = new Date(Date.now() + this.runInterval);
        this.timer = setInterval(() => this.runNow(), this.runInterval);
    }

    /**
     * Manually triggers a run of the billing cycle.
     * @returns {Promise<number>} The number of invoices generated.
     */
    async runNow() {
        if (this.isExecuting) {
            console.warn("Billing cycle is already running. Skipping this execution.");
            return 0;
        }
        this.isExecuting = true;
        console.log('Running billing cycle...');
        let generatedCount = 0;
        try {
            const members = this.dataStore.getMembers();
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (const member of members) {
                if (member.subscription?.status !== 'Active') continue;

                // NEW: Check if contract is still valid
                const contractEndDate = member.contractEndDate ? new Date(member.contractEndDate) : null;
                if (contractEndDate && today > contractEndDate) {
                    console.log(`Contract for ${member.name} has expired. Skipping subscription processing.`);
                    // Optionally, set member status to 'Expired' here
                    continue;
                }

                const renewalDate = new Date(member.subscription.renewalDate);
                renewalDate.setHours(0, 0, 0, 0);

                if (renewalDate <= today) {
                    // Subscription is due. Generate invoice and update renewal date.
                    const planDetails = { description: member.subscription.plan, price: member.subscription.plan === 'Premium Monthly' ? 99.99 : 49.99 };
                    await this.dataStore.addInvoice({ memberId: member.id, amount: planDetails.price, date: new Date().toISOString().split('T')[0], status: 'Pending', items: [{ ...planDetails, quantity: 1 }] });
                    generatedCount++;

                    const nextRenewalDate = new Date(renewalDate);
                    nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
                    await this.dataStore.updateMemberSubscription(member.id, { renewalDate: nextRenewalDate.toISOString().split('T')[0] });
                    console.log(`Processed subscription for ${member.name}. New renewal: ${nextRenewalDate.toISOString().split('T')[0]}`);
                }
            }
        } catch (error) {
            console.error('Error during billing cycle run:', error);
            this.app.uiManager.showNotification('An error occurred during the automated billing run.', 'error');
        } finally {
            this.isExecuting = false;
            this.lastRun = new Date();
            if (this.isRunning) this.scheduleNextRun();
            if (generatedCount > 0) this.app.uiManager.showNotification(`Automated billing run complete. ${generatedCount} new invoices created.`, 'info');
            return generatedCount;
        }
    }
}

export default BillingCycleService;