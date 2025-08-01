
/**
 * @description Displays a modal to add or edit a member.
 * @param {object|null} member - The member object to edit, or null to add a new one.
 * @param {function} onSave - The callback function to execute after saving.
 */
export function showmemberModal(member, onSave) {
    const isEditing = !!member;
    const title = isEditing ? 'Edit Member' : 'Add New Member';
    const buttonText = isEditing ? 'Save Changes' : 'Add Member';

    const plans = ['Bronze', 'Silver', 'Gold', 'Platinum'];
    const statuses = ['Active', 'Inactive'];

    const formHTML = `
        <form id="member-form" class="modal-form">
            <div class="form-group">
                <label for="member-name">Name</label>
                <input type="text" id="member-name" class="form-control" value="${isEditing ? member.name : ''}" required>
            </div>
            <div class="form-group">
                <label for="member-email">Email</label>
                <input type="email" id="member-email" class="form-control" value="${isEditing ? member.email : ''}" required>
            </div>
            <div class="form-group">
                <label for="member-plan">Membership Plan</label>
                <select id="member-plan" class="form-control" required>
                    ${plans.map(p => `<option value="${p}" ${isEditing && member.membership?.plan === p ? 'selected' : ''}>${p}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="member-status">Status</label>
                <select id="member-status" class="form-control" required>
                    ${statuses.map(s => `<option value="${s}" ${isEditing && member.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">${buttonText}</button>
            </div>
        </form>
    `;

        // uIManager.showModal(title, formHTML);

    document.getElementById('member-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const memberData = {
            name: document.getElementById('member-name').value,
            email: document.getElementById('member-email').value,
            status: document.getElementById('member-status').value,
            membership: {
                plan: document.getElementById('member-plan').value,
            }
        };

        if (isEditing) {
            await dataStore.updatemember(member.id, memberData);
        } else {
            await dataStore.addmember(memberData);
        }

        onSave();
    });
}