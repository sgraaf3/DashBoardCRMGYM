function showMemberModal(app, member, onSave) {
    const isEditing = !!member;
    const title = isEditing ? app.localizationService.t('crm.members.edit') : app.localizationService.t('crm.addmember');
    const plans = ['Gold', 'Silver', 'Bronze'];
    const statuses = ['Active', 'Inactive'];

    const modalBody = `
        <form id="member-form" class="modal-form">
            <div class="form-group"><label for="m-name">Name</label><input id="m-name" value="${member?.name || ''}" required></div>
            <div class="form-group"><label for="m-email">Email</label><input id="m-email" type="email" value="${member?.email || ''}" required></div>
            <div class="form-group"><label for="m-plan">Plan</label><select id="m-plan">${plans.map(p => `<option value="${p}" ${member?.membership.plan === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
            <div class="form-group"><label for="m-status">Status</label><select id="m-status">${statuses.map(s => `<option value="${s}" ${member?.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
            <div class="modal-actions"><button type="submit" class="btn btn-primary">Save</button></div>
        </form>
    `;
    // app.uiManager.showModal(title, modalBody);

    document.getElementById('member-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const memberData = {
            name: document.getElementById('m-name').value,
            email: document.getElementById('m-email').value,
            status: document.getElementById('m-status').value,
            membership: { plan: document.getElementById('m-plan').value }
        };
        isEditing ? await app.dataStore.updateMember(member.id, memberData) : await app.dataStore.addMember(memberData);
        app.uiManager.hideModal();
        onSave();
    });
}

function showEmployeeModal(app, employee, onSave) {
    const isEditing = !!employee;
    const title = isEditing ? app.localizationService.t('crm.employees.edit') : app.localizationService.t('crm.employees.addEmployee');
    const roles = ['Coach', 'Admin'];

    const modalBody = `
        <form id="employee-form" class="modal-form">
            <div class="form-group"><label for="e-name">Name</label><input id="e-name" value="${employee?.name || ''}" required></div>
            <div class="form-group"><label for="e-role">Role</label><select id="e-role">${roles.map(r => `<option value="${r}" ${employee?.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
            <div class="form-group"><label for="e-specialty">Specialty</label><input id="e-specialty" value="${employee?.specialty || ''}"></div>
            <div class="modal-actions"><button type="submit" class="btn btn-primary">Save</button></div>
        </form>
    `;
    // app.uiManager.showModal(title, modalBody);

    document.getElementById('employee-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const employeeData = {
            name: document.getElementById('e-name').value,
            role: document.getElementById('e-role').value,
            specialty: document.getElementById('e-specialty').value,
        };
        isEditing ? await app.dataStore.updateEmployee(employee.id, employeeData) : await app.dataStore.addEmployee(employeeData);
        app.uiManager.hideModal();
        onSave();
    });
}

function showProfileEditModal(app, user, onSave) {
    const title = 'Edit Profile';
    const modalBody = `
        <form id="profile-edit-form" class="modal-form">
            <div class="form-group">
                <label for="profile-name">Full Name</label>
                <input id="profile-name" value="${user.name}" required>
            </div>
            <div class="modal-actions">
                <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
        </form>
    `;
    // app.uiManager.showModal(title, modalBody);

    document.getElementById('profile-edit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = document.getElementById('profile-name').value;
        app.dataStore.updateUser(user.id, { name: newName });
        app.authManager.currentUser.name = newName; 
        app.uiManager.hideModal();
        onSave();
    });
}

function showSchemaBuilderModal(app, schema, onSave) {
    const isEditing = !!schema;
    const title = isEditing ? 'Edit Workout Schema' : 'Create New Workout Schema';

    const renderExerciseRow = (ex = {}) => {
        const isTimed = ex.type === 'timed';
        return `
            <div class="exercise-block" data-type="${isTimed ? 'timed' : 'standard'}">
                <div class="exercise-inputs">
                    <input name="ex-name" placeholder="Exercise Name" value="${ex.name || ''}" required>
                    ${isTimed
                        ? `<input name="ex-duration" placeholder="Duration (e.g., 60s)" value="${ex.duration || ''}">`
                        : `<input name="ex-sets" placeholder="Sets" value="${ex.sets || ''}">
                           <input name="ex-reps" placeholder="Reps" value="${ex.reps || ''}">`
                    }
                </div>
                <button type="button" class="btn btn-danger remove-exercise-btn">&times;</button>
            </div>
        `;
    };

    const existingExercisesHtml = schema?.exercises.map(renderExerciseRow).join('') || '';

    const modalBody = `
        <form id="schema-builder-form" class="modal-form">
            <input type="hidden" name="id" value="${schema?.id || ''}">
            <div class="form-group">
                <label for="schema-name">Schema Name</label>
                <input id="schema-name" name="name" value="${schema?.name || ''}" required>
            </div>
            <div class="form-group">
                <label for="schema-description">Description</label>
                <textarea id="schema-description" name="description">${schema?.description || ''}</textarea>
            </div>
            <div id="exercise-list-container">${existingExercisesHtml}</div>
            <div class="modal-actions">
                <button type="button" id="add-standard-ex" class="btn">Add Standard Exercise</button>
                <button type="button" id="add-timed-ex" class="btn">Add Timed Exercise</button>
                <button type="submit" class="btn btn-primary">${isEditing ? 'Update' : 'Save'} Schema</button>
            </div>
        </form>
    `;
    // app.uiManager.showModal(title, modalBody);

    const modalRoot = app.uiManager.modalBody;
    const form = modalRoot.querySelector('#schema-builder-form');
    const exerciseContainer = modalRoot.querySelector('#exercise-list-container');

    modalRoot.querySelector('#add-standard-ex')?.addEventListener('click', () => {
        exerciseContainer.insertAdjacentHTML('beforeend', renderExerciseRow({ type: 'standard' }));
    });

    modalRoot.querySelector('#add-timed-ex')?.addEventListener('click', () => {
        exerciseContainer.insertAdjacentHTML('beforeend', renderExerciseRow({ type: 'timed' }));
    });

    exerciseContainer?.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-exercise-btn')) {
            e.target.closest('.exercise-block').remove();
        }
    });

    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const schemaData = {
            id: form.querySelector('input[name="id"]').value || null,
            name: form.querySelector('#schema-name').value,
            description: form.querySelector('#schema-description').value,
            exercises: []
        };

        exerciseContainer.querySelectorAll('.exercise-block').forEach(block => {
            const type = block.dataset.type;
            const nameInput = block.querySelector('input[name="ex-name"]');
            if (!nameInput || !nameInput.value) return; 

            const exercise = { type, name: nameInput.value };

            if (type === 'standard') {
                const setsInput = block.querySelector('input[name="ex-sets"]');
                const repsInput = block.querySelector('input[name="ex-reps"]');
                exercise.sets = setsInput ? setsInput.value : '';
                exercise.reps = repsInput ? repsInput.value : '';
            } else if (type === 'timed') {
                const durationInput = block.querySelector('input[name="ex-duration"]');
                exercise.duration = durationInput ? durationInput.value : '';
            }
            schemaData.exercises.push(exercise);
        });

        if (schemaData.id === null) delete schemaData.id;

        app.dataStore.saveWorkoutSchema(schemaData);
        app.uiManager.hideModal();
        app.uiManager.showNotification('Schema saved successfully!', 'success');
        if (onSave) {
            onSave();
        }
    });
}

export { showMemberModal, showEmployeeModal, showProfileEditModal, showSchemaBuilderModal };