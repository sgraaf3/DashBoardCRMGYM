class ProfileEditView {
    constructor(app) {
        this.app = app;
    }

    render(container, user) {
        const profile = user.linkedMemberId
            ? this.app.dataStore.getMemberById(user.linkedMemberId)
            : this.app.dataStore.getEmployeeById(user.linkedEmployeeId);

        if (!profile) {
            container.innerHTML = `<p class="text-danger">Error: Could not load profile data to edit.</p>`;
            return;
        }

        const isMember = !!user.linkedMemberId;
        const title = 'Edit Profile';

        container.innerHTML = `
            <div class="view-header">
                <h1>${title}</h1>
            </div>
            <form id="profile-edit-form">
                <div class="settings-grid">
                    <div class="widget">
                        <h3>Account Details</h3>
                        <div class="form-group">
                            <label for="profile-name">Full Name</label>
                            <input id="profile-name" name="name" class="form-control" value="${profile.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="profile-email">Email (Username)</label>
                            <input id="profile-email" name="username" class="form-control" value="${user.username || ''}" disabled>
                            <p class="note">Username cannot be changed.</p>
                        </div>
                    </div>

                    ${isMember ? `
                    <div class="widget">
                        <h3>Physical & Performance Metrics</h3>
                        <div class="form-row">
                            <div class="form-group"><label for="profile-weight">Weight (kg)</label><input type="number" step="0.1" id="profile-weight" name="weight" class="form-control" value="${profile.weight || ''}"></div>
                            <div class="form-group"><label for="profile-height">Height (cm)</label><input type="number" id="profile-height" name="height" class="form-control" value="${profile.height || ''}"></div>
                            <div class="form-group"><label for="profile-fat">Body Fat (%)</label><input type="number" step="0.1" id="profile-fat" name="fatPercentage" class="form-control" value="${profile.fatPercentage || ''}"></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label for="ramp-watts">Ramp Test (Watts)</label><input type="number" id="ramp-watts" name="wattRampTest_watts" class="form-control" value="${profile.wattRampTest?.watts || ''}"></div>
                            <div class="form-group"><label for="ramp-date">Ramp Test Date</label><input type="date" id="ramp-date" name="wattRampTest_date" class="form-control" value="${profile.wattRampTest?.date || ''}"></div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <div class="view-actions">
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                    <button type="button" id="cancel-edit-btn" class="btn btn-secondary">Cancel</button>
                </div>
            </form>
        `;
        this.addEventListeners(container, user, profile);
    }

    addEventListeners(container, user, profile) {
        container.querySelector('#profile-edit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const updatedData = {
                name: formData.get('name'),
                weight: formData.get('weight'),
                height: formData.get('height'),
                fatPercentage: formData.get('fatPercentage'),
                wattRampTest: {
                    watts: formData.get('wattRampTest_watts'),
                    date: formData.get('wattRampTest_date')
                }
            };

            // Update the correct record (member or employee)
            const updatePromise = user.linkedMemberId
                ? this.app.dataStore.updateMember(profile.id, updatedData)
                : this.app.dataStore.updateEmployee(profile.id, { name: updatedData.name });

            updatePromise.then(() => {
                this.app.uiManager.showNotification('Profile updated successfully!', 'success');
                window.location.hash = '#/settings'; // Navigate back to settings after save
            });
        });

        container.querySelector('#cancel-edit-btn').addEventListener('click', () => {
            window.location.hash = '#/settings'; // Navigate back to settings on cancel
        });
    }
}

export default ProfileEditView;
