

/**
 * @description Shows a modal to create or edit an employee.
 * @param {string|number|null} employeeId - The ID of the employee to edit, or null to create a new one.
 * @param {Function} onSave - A callback function to execute after saving.
 */
export async function showemployeeModal(employeeId = null, onSave) {
    const isEditing = employeeId !== null;
    const employee = isEditing ? await dataStore.getemployeeById(employeeId) : {};

    if (isEditing && !employee) {
        uIManager.showMessage(`employee with ID ${employeeId} not found.`, 'error');
        return;
    }

    const title = isEditing ? `Edit Employee: ${employee.name}` : 'Add New Employee';
    const buttonText = isEditing ? 'Save Changes' : 'Add Employee';
    const roles = ['Admin', 'Coach'];

    const modalContent = `
        <form id="employee-form" class="modal-form">
            <input type="hidden" name="id" value="${employee?.id || ''}">
            <div class="form-group">
                <label for="employee-name">Name</label>
                <input type="text" id="employee-name" name="name" class="form-control" value="${employee?.name || ''}" required>
            </div>
            <div class="form-group">
                <label for="employee-role">Role</label>
                <select id="employee-role" name="role" class="form-control">
                    ${roles.map(r => `<option value="${r}" ${employee?.role === r ? 'selected' : ''}>${r}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="employee-specialty">Specialty</label>
                <input type="text" id="employee-specialty" name="specialty" class="form-control" value="${employee?.specialty || ''}">
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">${buttonText}</button>
            </div>
        </form>
    `;

        // uIManager.showModal(title, modalContent);

    document.getElementById('employee-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const employeeData = {
            name: document.getElementById('employee-name').value,
            role: document.getElementById('employee-role').value,
            specialty: document.getElementById('employee-specialty').value,
        };

        isEditing
            ? await dataStore.updateemployee(employeeId, employeeData)
            : await dataStore.addemployee(employeeData);

        onSave();
    });
}