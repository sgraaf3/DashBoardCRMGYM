
class MyBookingsView {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'my-bookings-view';
    }

    async render(mainContentEl) {
        this.container.innerHTML = `
            <div class="view-header">
                <h1>${LocalizationService.t('myBookings.title')}</h1>
            </div>
            <div class="view-body">
                <p>${LocalizationService.t('myBookings.description')}</p>
                <div id="my-bookings-list"></div>
            </div>
        `;
        mainContentEl.appendChild(this.container);
        await this.loadMyBookings();
    }

    async loadMyBookings() {
        const bookingsListEl = this.container.querySelector('#my-bookings-list');
        bookingsListEl.innerHTML = '<p>Loading your bookings...</p>';

        try {
            // Assuming an API endpoint for fetching user's bookings
            const response = await api.get('/api/bookings/my'); 
            const bookings = await response.json();

            if (bookings.length === 0) {
                bookingsListEl.innerHTML = '<p>You have no upcoming bookings.</p>';
                return;
            }

            bookingsListEl.innerHTML = `
                <ul>
                    ${bookings.map(booking => `
                        <li>
                            <strong>${booking.lessonName}</strong> on ${new Date(booking.date).toLocaleDateString()} at ${booking.time}
                            <br>Status: ${booking.status}
                        </li>
                    `).join('')}
                </ul>
            `;

        } catch (error) {
            console.error('Error loading my bookings:', error);
            bookingsListEl.innerHTML = '<p>Error loading bookings. Please try again later.</p>';
        }
    }

    destroy() {
        // Clean up any event listeners if necessary
        this.container.innerHTML = '';
    }
}

export default MyBookingsView;
