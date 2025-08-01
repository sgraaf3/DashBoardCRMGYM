
let membersData = [];
let membersCurrentPage = 1;
const membersRowsPerPage = 4;

/**
 * Initializes all functionality for the Members widget.
 * @param {function} showNotification - The global notification function.
 */
export async function initMembers(showNotification) {
    const membersWidget = document.getElementById('members-widget');
    const tbody = document.getElementById('members-tbody');
    const searchInput = document.getElementById('member-search-input');
    const addMemberBtn = document.getElementById('add-member-btn');
    const memberModal = document.getElementById('add-member-modal');
    const memberForm = document.getElementById('add-member-form');

    const renderMembers = async () => {
        membersWidget.classList.add('is-loading');
        tbody.innerHTML = ''; // Clear previous content to show spinner

        try {
            membersData = await apiService.getMembers(); // Fetch latest data
            membersWidget.classList.remove('has-error'); // Clear previous error state
        } catch (error) {
            console.error("Failed to load members:", error);
            showNotification('Failed to load members. Please check the connection.', 'error');
            membersWidget.classList.add('has-error');
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="error-message">
                        <i class="fas fa-exclamation-triangle"></i> Error loading data. Please try again later.
                    </td>
                </tr>`;
            return;
        } finally {
            // Always remove loading state, whether success or failure
            membersWidget.classList.remove('is-loading');
        }

        const searchTerm = searchInput.value.toLowerCase();
        const filteredData = membersData.filter(m => m.name.toLowerCase().includes(searchTerm) || m.email.toLowerCase().includes(searchTerm));
        
        const pageCount = Math.ceil(filteredData.length / membersRowsPerPage);
        const paginationControls = document.getElementById('member-pagination-controls');
        paginationControls.innerHTML = '';

        for (let i = 1; i <= pageCount; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.className = 'page-btn';
            if (i === membersCurrentPage) pageButton.classList.add('active');
            pageButton.addEventListener('click', () => {
                membersCurrentPage = i;
                renderMembers();
            });
            paginationControls.appendChild(pageButton);
        }

        tbody.innerHTML = '';
        const start = (membersCurrentPage - 1) * membersRowsPerPage;
        const end = start + membersRowsPerPage;
        const paginatedData = filteredData.slice(start, end);

        paginatedData.forEach((member) => {
            const row = tbody.insertRow();
            row.dataset.id = member.id;
            row.innerHTML = `
                <td>${member.name}</td>
                <td>${member.email}</td>
                <td><span class="status-active">${member.status}</span></td>
                <td>
                    <button class="action-btn edit-btn" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
                </td>
            `;
        });
    };

    searchInput.addEventListener('keyup', () => {
        membersCurrentPage = 1;
        renderMembers();
    });

    addMemberBtn.addEventListener('click', () => {
        memberForm.reset();
        memberForm.dataset.mode = 'add';
        document.getElementById('member-modal-title').textContent = 'Add New Member';
        memberModal.classList.add('active');
    });

    tbody.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (!row) return;
        const id = row.dataset.id;
        const member = membersData.find(m => m.id === id);

        if (e.target.closest('.edit-btn')) {
            memberForm.reset();
            memberForm.dataset.mode = 'edit';
            memberForm.dataset.id = id;
            document.getElementById('member-modal-title').textContent = 'Edit Member';
            document.getElementById('member-name').value = member.name;
            document.getElementById('member-email').value = member.email;
            memberModal.classList.add('active');
        }

        if (e.target.closest('.delete-btn')) {
            showConfirmModal(`Are you sure you want to remove ${member.name}?`, async () => {
                try {
                    await apiService.deleteMember(id);
                    showNotification(`${member.name} has been removed.`, 'error');
                    await renderMembers();
                } catch (error) {
                    showNotification('Failed to remove member.', 'error');
                }
            });
        }
    });

    memberForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('member-name').value;
        const email = document.getElementById('member-email').value;
        const submitBtn = memberForm.querySelector('.form-submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
            if (memberForm.dataset.mode === 'edit') {
                const id = memberForm.dataset.id;
                await apiService.updateMember(id, { name, email });
                showNotification('Member updated.');
            } else {
                await apiService.addMember({ name, email, status: 'Active' });
                showNotification('Member added.');
            }
            await renderMembers();
            memberModal.classList.remove('active');
        } catch (error) {
            showNotification('Operation failed. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save Member';
        }
    });

    renderMembers();
}
