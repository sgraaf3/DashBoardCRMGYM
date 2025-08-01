

export default class employeeList {
    constructor() {
        this.dataStore = dataStore;
        this.uIManager = uIManager;
        this.employees = [];
        this.filteredEmployees = [];
        this.container = null;
        this.currentPage = 1;
        this.itemsPerPage = 5;
    }

    async render(container) {
        this.container = container;
        this.employees = await this.dataStore.getemployees();
        this.filteredEmployees = [...this.employees];

        container.innerHTML = `
            <div class="widget">
                <div class="widget-header">
                    <h3>${LocalizationService.t('crm.employees.title')}</h3>
                    <div class="widget-controls">
                        <select id="employee-role-filter" class="form-control">
                            <option value="all">${LocalizationService.t('crm.employees.roleAll')}</option>
                            <option value="Admin">${LocalizationService.t('crm.employees.roleAdmin')}</option>
                            <option value="Coach">${LocalizationService.t('crm.employees.roleCoach')}</option>
                        </select>
                        <input type="text" id="employee-search" placeholder="${LocalizationService.t('crm.employees.searchPlaceholder')}" class="form-control">
                        <button id="add-employee-btn" class="btn btn-primary">${LocalizationService.t('crm.employees.addEmployee')}</button>
                    </div>
                </div>
                <ul id="employee-list-ul" class="list-group">
                    <!-- Employee items will be rendered here -->
                </ul>
                <div id="employee-list-pagination" class="pagination-controls">
                    <!-- Pagination controls will be rendered here -->
                </div>
            </div>
        `;

        this._updateListView();
        this._addEventListeners();
    }

    _updateListView() {
        const listElement = this.container.querySelector('#employee-list-ul');
        const paginationContainer = this.container.querySelector('#employee-list-pagination');
        if (!listElement) return;

        // Slicing for pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageItems = this.filteredEmployees.slice(startIndex, endIndex);

        // Render list items
        if (this.filteredEmployees.length === 0) {
            listElement.innerHTML = '<li class="list-group-item">No employees found matching your criteria.</li>';
        } else {
            listElement.innerHTML = pageItems.map(emp => `
                <li class="list-group-item">
                    <a href="#/crm/employees/${emp.id}">${emp.name}</a>
                    <span class="item-subtext">${emp.role}</span>
                </li>
            `).join('');
        }

        // Render pagination controls
        const totalPages = Math.ceil(this.filteredEmployees.length / this.itemsPerPage);
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
        } else {
            paginationContainer.innerHTML = `
                <button id="emp-prev-page-btn" class="btn" ${this.currentPage === 1 ? 'disabled' : ''}>Previous</button>
                <span>Page ${this.currentPage} of ${totalPages}</span>
                <button id="emp-next-page-btn" class="btn" ${this.currentPage === totalPages ? 'disabled' : ''}>Next</button>
            `;
        }
    }

    _applyFilters() {
        const searchTerm = this.container.querySelector('#employee-search').value.toLowerCase();
        const roleFilter = this.container.querySelector('#employee-role-filter').value;

        let employees = [...this.employees];

        if (searchTerm) {
            employees = employees.filter(employee => employee.name.toLowerCase().includes(searchTerm));
        }

        if (roleFilter !== 'all') {
            employees = employees.filter(employee => employee.role === roleFilter);
        }

        this.filteredEmployees = employees;
        this.currentPage = 1; // Reset to first page on filter change
        this._updateListView();
    }

    _addEventListeners() {
        this.container.querySelector('#employee-search').addEventListener('input', () => this._applyFilters());
        this.container.querySelector('#employee-role-filter').addEventListener('change', () => this._applyFilters());

        // Use event delegation for pagination buttons since they are re-rendered
        this.container.querySelector('#employee-list-pagination').addEventListener('click', (e) => {
            const totalPages = Math.ceil(this.filteredEmployees.length / this.itemsPerPage);
            if (e.target.id === 'emp-prev-page-btn' && this.currentPage > 1) {
                this.currentPage--;
                this._updateListView();
            }
            if (e.target.id === 'emp-next-page-btn' && this.currentPage < totalPages) {
                this.currentPage++;
                this._updateListView();
            }
        });

        this.container.querySelector('#add-employee-btn').addEventListener('click', () => {
            showemployeeModal(null, async () => {
                this.uIManager.hideModal();
                this.uIManager.showNotification('Employee added successfully!', 'success');
                await this.render(this.container);
            });
        });
    }
}