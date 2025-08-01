

/**
 * @class memberList
 * @description Renders a searchable and filterable list of members in the CRM view.
 */
export default class memberList {
    constructor() {
        this.dataStore = dataStore;
        this.uIManager = uIManager;
        this.members = [];
        this.filteredMembers = [];
        this.container = null;
        this.currentPage = 1;
        this.itemsPerPage = 5; // Or a configurable value
    }

    async render(container) {
        this.container = container;
        this.members = await this.dataStore.getmembers();
        this.filteredMembers = [...this.members];

        container.innerHTML = `
            <div class="widget">
                <div class="widget-header">
                    <h3>${LocalizationService.t('crm.members.title')}</h3>
                    <div class="widget-controls">
                        <select id="member-status-filter" class="form-control">
                            <option value="all">${LocalizationService.t('crm.statusAll')}</option>
                            <option value="Active">${LocalizationService.t('crm.statusActive')}</option>
                            <option value="Inactive">${LocalizationService.t('crm.statusInactive')}</option>
                        </select>
                        <input type="text" id="member-search" placeholder="${LocalizationService.t('crm.searchPlaceholder')}" class="form-control">
                        <button id="add-member-btn" class="btn btn-primary">${LocalizationService.t('crm.addmember')}</button>
                    </div>
                </div>
                <ul id="member-list-ul" class="list-group">
                    <!-- Member items will be rendered here -->
                </ul>
                <div id="member-list-pagination" class="pagination-controls">
                    <!-- Pagination controls will be rendered here -->
                </div>
            </div>
        `;

        this._updateListView();
        this._addEventListeners();
    }

    _updateListView() {
        const listElement = this.container.querySelector('#member-list-ul');
        const paginationContainer = this.container.querySelector('#member-list-pagination');
        if (!listElement) return;

        // Slicing for pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageItems = this.filteredMembers.slice(startIndex, endIndex);

        // Render list items
        if (this.filteredMembers.length === 0) {
            listElement.innerHTML = '<li class="list-group-item">No members found matching your criteria.</li>';
        } else {
            listElement.innerHTML = pageItems.map(mem => `
                <li class="list-group-item">
                    <a href="#/crm/members/${mem.id}">${mem.name}</a>
                    <span class="item-subtext status status-${mem.status.toLowerCase()}">${mem.status}</span>
                </li>
            `).join('');
        }

        // Render pagination controls
        const totalPages = Math.ceil(this.filteredMembers.length / this.itemsPerPage);
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
        } else {
            paginationContainer.innerHTML = `
                <button id="prev-page-btn" class="btn" ${this.currentPage === 1 ? 'disabled' : ''}>Previous</button>
                <span>Page ${this.currentPage} of ${totalPages}</span>
                <button id="next-page-btn" class="btn" ${this.currentPage === totalPages ? 'disabled' : ''}>Next</button>
            `;
        }
    }

    _applyFilters() {
        const searchTerm = this.container.querySelector('#member-search').value.toLowerCase();
        const statusFilter = this.container.querySelector('#member-status-filter').value;

        let members = [...this.members];

        if (searchTerm) {
            members = members.filter(member => member.name.toLowerCase().includes(searchTerm));
        }

        if (statusFilter !== 'all') {
            members = members.filter(member => member.status === statusFilter);
        }

        this.filteredMembers = members;
        this.currentPage = 1; // Reset to first page on filter change
        this._updateListView();
    }

    _addEventListeners() {
        this.container.querySelector('#member-search').addEventListener('input', () => this._applyFilters());
        this.container.querySelector('#member-status-filter').addEventListener('change', () => this._applyFilters());

        // Use event delegation for pagination buttons since they are re-rendered
        this.container.querySelector('#member-list-pagination').addEventListener('click', (e) => {
            const totalPages = Math.ceil(this.filteredMembers.length / this.itemsPerPage);
            if (e.target.id === 'prev-page-btn' && this.currentPage > 1) {
                this.currentPage--;
                this._updateListView();
            }
            if (e.target.id === 'next-page-btn' && this.currentPage < totalPages) {
                this.currentPage++;
                this._updateListView();
            }
        });

        this.container.querySelector('#add-member-btn').addEventListener('click', () => {
            showmemberModal(null, async () => {
                this.uIManager.hideModal();
                this.uIManager.showNotification('Member added successfully!', 'success');
                // Re-fetch and re-render the list
                await this.render(this.container);
            });
        });
    }
}