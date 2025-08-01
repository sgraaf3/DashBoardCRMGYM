

class BookingManagementView {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'booking-management-view';
    }

    async render(mainContentEl) {
        this.container.innerHTML = `
            <div class="view-header">
                <h1>${LocalizationService.t('bookingManagement.title')}</h1>
            </div>
            <div class="view-body">
                <p>${LocalizationService.t('bookingManagement.description')}</p>
                <div id="pending-bookings-list"></div>
            </div>
        `;
        mainContentEl.appendChild(this.container);
        await this.loadPendingBookings();
    }

    async loadPendingBookings() {
        const pendingBookingsListEl = this.container.querySelector('#pending-bookings-list');
        pendingBookingsListEl.innerHTML = '<p>Loading pending bookings...</p>';

        try {
            // Assuming an API endpoint for fetching pending bookings for instructors/admins
            const response = await api.get('/api/bookings/pending'); 
            const bookings = await response.json();

            if (bookings.length === 0) {
                pendingBookingsListEl.innerHTML = '<p>No pending booking requests.</p>';
                return;
            }

            pendingBookingsListEl.innerHTML = `
                <ul>
                    ${bookings.map(booking => `
                        <li>
                            <strong>${booking.lessonName}</strong> by ${booking.userName} on ${new Date(booking.date).toLocaleDateString()} at ${booking.time}
                            <button data-booking-id="${booking.id}" data-action="approve">Approve</button>
                            <button data-booking-id="${booking.id}" data-action="deny">Deny</button>
                        </li>
                    `).join('')}
                </ul>
            `;
            this.addEventListeners();

        } catch (error) {
            console.error('Error loading pending bookings:', error);
            pendingBookingsListEl.innerHTML = '<p>Error loading pending bookings. Please try again later.</p>';
        }
    }

    addEventListeners() {
        this.container.querySelectorAll('button[data-action]').forEach(button => {
            button.addEventListener('click', this.handleBookingAction.bind(this));
        });
    }

    async handleBookingAction(event) {
        const button = event.target;
        const bookingId = button.dataset.bookingId;
        const action = button.dataset.action;

        try {
            // Assuming API endpoints for approving/denying bookings
            const response = await api.post(`/api/bookings/${bookingId}/${action}`);
            if (response.ok) {
                alert(`Booking ${bookingId} ${action}ed successfully.`);
                this.loadPendingBookings(); // Reload the list
            } else {
                alert(`Failed to ${action} booking ${bookingId}.`);
            }
        } catch (error) {
            console.error(`Error ${action}ing booking:`, error);
            alert(`Error ${action}ing booking. Please try again.`);
        }
    }

    destroy() {
        // Clean up any event listeners if necessary
        this.container.querySelectorAll('button[data-action]').forEach(button => {
            button.removeEventListener('click', this.handleBookingAction.bind(this));
        });
        this.container.innerHTML = '';
    }
}

export default BookingManagementView;
