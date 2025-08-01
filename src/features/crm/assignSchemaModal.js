/**
 * @description Shows a modal to assign a workout schema to a member.
 * @param {uIManager} uIManager - The application's UI manager instance.
 * @param {dataStore} dataStore - The application's data store instance.
 * @param {string|number} memberId - The ID of the member.
 * @param {Function} onSave - A callback function to execute after saving.
 */
export  default async function showAssignSchemaModal(uIManager, dataStore, memberId, onSave) {
    const member = await dataStore.getmemberById(memberId);
    const schemas = await dataStore.getWorkoutSchemas();

    const title = `Assign Schema to ${member.name}`;

    const modalContent = `
        <form id="assign-schema-form">
            <div class="form-group">
                <label for="schema-select">Select a Workout Schema</label>
                <select id="schema-select" name="schemaId" class="form-control">
                    <option value="">None</option>
                    ${schemas.map(s => `<option value="${s.id}" ${member.assignedSchemaId == s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                </select>
            </div>
            <div class="modal-footer">
                <button type="submit" class="btn btn-primary">Save Assignment</button>
            </div>
        </form>
    `;

    // Show the modal without the backdrop by passing the `backdrop: false` option.
    // uIManager.showModal(title, modalContent, { backdrop: false });

    const form = document.getElementById('assign-schema-form');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
            const formData = new FormData(form);
            const schemaId = parseInt(formData.get('schemaId')) || null;
    
            await dataStore.assignSchemaTomember(memberId, schemaId);
            uIManager.showMessage('Schema assigned successfully!', 'success');
            uIManager.hideModal();
            if (onSave) onSave();
        } catch (error) {
            console.error(`Failed to assign schema to member ${memberId}:`, error);
            uIManager.showMessage('Failed to assign schema. See console for details.', 'error');
        }
    });
}