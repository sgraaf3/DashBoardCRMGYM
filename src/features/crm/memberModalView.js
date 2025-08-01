class MemberModalView {
    constructor(app) {
        this.app = app;
    }

    render(container, member, onSave) {
        const isEditing = !!member;
        const title = isEditing ? this.app.localizationService.t('crm.members.edit') : this.app.localizationService.t('crm.addmember');
        const plans = ['Gold', 'Silver', 'Bronze'];
        const statuses = ['Active', 'Inactive'];

        container.innerHTML = `
            <div class="view-header">
                <h2>${title}</h2>
            </div>
            <form id="member-form" class="modal-form">
                <div class="form-group"><label for="m-name">Name</label><input id="m-name" value="${member?.name || ''}" required></div>
                <div class="form-group"><label for="m-email">Email</label><input id="m-email" type="email" value="${member?.email || ''}" required></div>
                <div class="form-group"><label for="m-plan">Plan</label><select id="m-plan">${plans.map(p => `<option value="${p}" ${member?.membership?.plan === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
                <div class="form-group"><label for="m-status">Status</label><select id="m-status">${statuses.map(s => `<option value="${s}" ${member?.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
                <div class="modal-actions"><button type="submit" class="btn btn-primary">Save</button></div>
            </form>
        `;
        this.addEventListeners(container, member, onSave);
    }

    addEventListeners(container, member, onSave) {
        container.querySelector('#member-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const memberData = {
                name: document.getElementById('m-name').value,
                email: document.getElementById('m-email').value,
                status: document.getElementById('m-status').value,
                membership: { plan: document.getElementById('m-plan').value }
            };
            const isEditing = !!member;
            isEditing ? await this.app.dataStore.updateMember(member.id, memberData) : await this.app.dataStore.addMember(memberData);
            this.app.uiManager.showNotification('Member saved successfully!', 'success');
            if (onSave) onSave();
            window.history.back(); // Go back to the previous view (e.g., member list)
        });
    }
}

export default MemberModalView;