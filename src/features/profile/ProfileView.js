class ProfileView {
    constructor(app) {
        this.app = app;
    }

    render(container) {
        const user = this.app.authManager.getCurrentUser(); // This is the user account
        // The actual profile data is in the linked member or employee record
        const profile = user.linkedMemberId
            ? this.app.dataStore.getMemberById(user.linkedMemberId)
            : this.app.dataStore.getEmployeeById(user.linkedEmployeeId);

        if (!profile) {
            container.innerHTML = `<p class="text-danger">Error: Could not load profile data.</p>`;
            return;
        }

        const isMember = !!user.linkedMemberId;

        container.innerHTML = `
            <div class="view-header">
                <h1>My Profile</h1>
                <div class="view-header-actions">
                    <button id="edit-profile-btn" class="btn btn-primary">Edit Profile</button>
                </div>
            </div>
            <div class="settings-grid">
                <div class="widget">
                    <h3>Account Details</h3>
                    <p><strong>Name:</strong> ${profile.name}</p>
                    <p><strong>Email:</strong> ${user.username}</p>
                    <p><strong>Role:</strong> ${user.role}</p>
                </div>
                ${isMember ? `
                <div class="widget">
                    <h3>Physical & Performance Metrics</h3>
                    <p><strong>Weight:</strong> ${profile.weight || 'N/A'} kg</p>
                    <p><strong>Height:</strong> ${profile.height || 'N/A'} cm</p>
                    <p><strong>Body Fat:</strong> ${profile.fatPercentage || 'N/A'} %</p>
                    <p><strong>Latest Ramp Test:</strong> ${profile.wattRampTest?.watts || 'N/A'} Watts (on ${profile.wattRampTest?.date ? new Date(profile.wattRampTest.date).toLocaleDateString() : 'N/A'})</p>
                </div>
                ` : ''}
            </div>
        `;
        this.addEventListeners(container);
    }
    addEventListeners(container) {
        container.querySelector('#edit-profile-btn').addEventListener('click', () => {
            // Navigate to the new profile edit view
            this.app.router.navigate('#/profile-settings');
        });
    }
}

export default ProfileView;