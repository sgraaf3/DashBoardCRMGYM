import { exerciseNames } from '../../data/exerciseData.js';
import { debounce } from '../../core/utils.js';

export default class SchemaBuilderView {
    constructor(app) {
        this.app = app;
        this.schema = null; // Will hold the current schema object
    }

    render(container, schema, onSave) {
        this.schema = schema || { exercises: [] }; // Initialize or use existing schema
        const isEditing = !!schema;
        const title = isEditing ? 'Edit Workout Schema' : 'Create New Workout Schema';

        const existingExercisesHtml = this.renderAllExerciseBlocks();

        container.innerHTML = `
            <div class="view-header">
                <h2>${title}</h2>
            </div>
            <form id="schema-builder-form">
                <input type="hidden" name="id" value="${schema?.id || ''}">
                <div class="form-section">
                    <h3>Basics</h3>
                    <div class="form-group">
                        <label for="schema-name">Schema Name</label>
                        <input id="schema-name" name="name" value="${schema?.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Schema Type</label>
                        <input type="radio" id="type-selfmade" name="schema-type" value="selfmade" ${!schema?.isPreset ? 'checked' : ''}>
                        <label for="type-selfmade">Self-Made</label>
                        <input type="radio" id="type-preset" name="schema-type" value="preset" ${schema?.isPreset ? 'checked' : ''}>
                        <label for="type-preset">Preset</label>
                    </div>
                    <div class="form-group">
                        <label for="schema-description">Description</label>
                        <textarea id="schema-description" name="description">${schema?.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <input type="checkbox" id="use-hrm" name="useHrm" ${schema?.useHrm ? 'checked' : ''}>
                        <label for="use-hrm">Use Heart Rate Monitor (HRM)</label>
                    </div>
                    <div class="form-group">
                        <input type="checkbox" id="free-training-hrm" name="freeTrainingHrm" ${schema?.freeTrainingHrm ? 'checked' : ''}>
                        <label for="free-training-hrm">Free Training HRM Mode</label>
                    </div>
                </div>

                <div class="form-section">
                    <h3>Schema Focus</h3>
                    <div class="form-group">
                        <label for="main-focus">Main Focus</label>
                        <select id="main-focus" name="mainFocus" class="form-control">
                            <option value="">Select a focus</option>
                            <option value="Speed" ${schema?.mainFocus === 'Speed' ? 'selected' : ''}>Speed</option>
                            <option value="Endurance" ${schema?.mainFocus === 'Endurance' ? 'selected' : ''}>Endurance</option>
                            <option value="Strength" ${schema?.mainFocus === 'Strength' ? 'selected' : ''}>Strength</option>
                            <option value="Flexibility" ${schema?.mainFocus === 'Flexibility' ? 'selected' : ''}>Flexibility</option>
                            <option value="Coordination" ${schema?.mainFocus === 'Coordination' ? 'selected' : ''}>Coordination</option>
                            <option value="Combination" ${schema?.mainFocus === 'Combination' ? 'selected' : ''}>Combination</option>
                        </select>
                    </div>
                    <div class="form-group" id="sub-focus-group" style="display: ${schema?.mainFocus && schema?.mainFocus !== 'Combination' ? 'block' : 'none'};">
                        <label for="sub-focus">Sub-Focus</label>
                        <select id="sub-focus" name="subFocus" class="form-control">
                            <!-- Options will be dynamically loaded here -->
                        </select>
                    </div>
                </div>

                <div class="form-section">
                    <h3>Show Preselection Options</h3>
                    <button type="button" id="build-schema-btn" class="btn btn-secondary">Build Schema</button>
                    <div class="form-group">
                        <label for="preselection-notes">Notes for Preselection</label>
                        <textarea id="preselection-notes" name="preselectionNotes">${schema?.preselectionNotes || ''}</textarea>
                    </div>
                </div>

                <div id="exercise-list-container">${existingExercisesHtml}</div>

                <div class="modal-actions">
                    <select id="exercise-type-select" class="form-control">
                        <option value="standard">Standard</option>
                        <option value="timed">Timed</option>
                        <option value="cardio">Cardio</option>
                        <option value="flexibility">Flexibility</option>
                        <option value="coordination">Coordination</option>
                        <option value="profile">Profile</option>
                        <option value="settings">Settings</option>
                        <option value="breathing">Breathing</option>
                        <option value="stress">Stress Measurement</option>
                        <option value="questionnaire">Questionnaire</option>
                    </select>
                    <button type="button" id="add-exercise-btn" class="btn">Add Exercise</button>
                    <button type="submit" class="btn btn-primary">${isEditing ? 'Update' : 'Save'} Schema</button>
                    <button type="button" id="delete-schema-btn" class="btn btn-danger" ${isEditing ? '' : 'style="display:none;"'}>Delete Schema</button>
                    <button type="button" id="empty-schema-btn" class="btn btn-warning">Empty Schema</button>
                </div>
            </form>
        `;
        this.addEventListeners(container, schema, onSave);
    }

    addEventListeners(container, onSave) {
        const form = container.querySelector('#schema-builder-form');
        const exerciseContainer = container.querySelector('#exercise-list-container');
        const useHrmCheckbox = container.querySelector('#use-hrm'); // Keep for later use if needed
        const freeTrainingHrmCheckbox = container.querySelector('#free-training-hrm');
        const exerciseTypeSelect = container.querySelector('#exercise-type-select');
        const addExerciseBtn = container.querySelector('#add-exercise-btn');

        const toggleFreeTrainingMode = () => {
            const isFreeTraining = freeTrainingHrmCheckbox.checked;
            useHrmCheckbox.checked = isFreeTraining;
            useHrmCheckbox.disabled = isFreeTraining;
            exerciseContainer.innerHTML = '';
            exerciseContainer.style.display = isFreeTraining ? 'none' : 'block';
            exerciseTypeSelect.disabled = isFreeTraining;
            addExerciseBtn.disabled = isFreeTraining;
        };

        freeTrainingHrmCheckbox.addEventListener('change', toggleFreeTrainingMode);

        container.querySelector('#add-exercise-btn')?.addEventListener('click', () => {
            const type = exerciseTypeSelect.value;
            this._showExerciseModal(null, type);
        });

        exerciseContainer?.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-exercise-btn')) {
                this._deleteExercise(e.target.closest('.exercise-block-summary').dataset.index);
            } else if (e.target.classList.contains('edit-exercise-btn')) {
                this._showExerciseModal(e.target.closest('.exercise-block-summary').dataset.index);
            }
        });

        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            const schemaData = {
                id: form.querySelector('input[name="id"]').value || null,
                name: form.querySelector('#schema-name').value.trim(),
                description: form.querySelector('#schema-description').value,
                isPreset: form.querySelector('#type-preset').checked,
                useHrm: form.querySelector('#use-hrm').checked,
                freeTrainingHrm: form.querySelector('#free-training-hrm').checked,
                mainFocus: form.querySelector('#main-focus').value,
                subFocus: form.querySelector('#sub-focus').value,
                preselectionNotes: form.querySelector('#preselection-notes').value,
                exercises: this.schema.exercises || []
            };

            if (schemaData.id === null) delete schemaData.id;

            this.app.dataStore.saveWorkoutSchema(schemaData);
            this.app.uiManager.showNotification('Schema saved successfully!', 'success');
            if (onSave) {
                onSave();
            }
            window.history.back(); // Go back to the previous view
        });

        // Event listener for main-focus dropdown
        const mainFocusSelect = container.querySelector('#main-focus');
        const subFocusGroup = container.querySelector('#sub-focus-group');
        const subFocusSelect = container.querySelector('#sub-focus');

        const updateSubFocusOptions = () => {
            const selectedMainFocus = mainFocusSelect.value;
            subFocusSelect.innerHTML = ''; // Clear existing options

            let subOptions = [];
            switch (selectedMainFocus) {
                case 'Speed':
                    subOptions = ["Explosiveness", "MaxSpeed", "Accelerations"];
                    break;
                case 'Endurance':
                    subOptions = ["Cardiovascular", "Muscular"];
                    break;
                case 'Strength':
                    subOptions = ["Max Strength", "Hypertrophy", "Strength Endurance"];
                    break;
                case 'Flexibility':
                    subOptions = ["Static", "Dynamic", "PNF"];
                    break;
                case 'Coordination':
                    subOptions = ["Agility", "Balance", "Reaction Time"];
                    break;
                case 'Combination':
                    subFocusGroup.style.display = 'none';
                    return;
                default:
                    break;
            }

            if (subOptions.length > 0) {
                subFocusSelect.innerHTML = subOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('');
                subFocusGroup.style.display = 'block';
            } else {
                subFocusGroup.style.display = 'none';
            }
        };

        mainFocusSelect.addEventListener('change', updateSubFocusOptions);
        // Initial call to set sub-focus options based on pre-selected main focus
        updateSubFocusOptions();

        // Event listener for Delete Schema button
        container.querySelector('#delete-schema-btn')?.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this schema?')) {
                const schemaIdToDelete = form.querySelector('input[name="id"]').value;
                if (schemaIdToDelete) {
                    await this.app.dataStore.deleteWorkoutSchema(parseInt(schemaIdToDelete));
                    this.app.uiManager.showNotification('Schema deleted successfully!', 'success');
                    this.app.router.navigate('#/gym'); // Go back to gym overview
                }
            }
        });

        // Event listener for Empty Schema button
        container.querySelector('#empty-schema-btn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to empty this schema? This will remove all exercises.')) {
                exerciseContainer.innerHTML = ''; // Clear all exercises
                this.app.uiManager.showNotification('Schema exercises cleared!', 'info');
            }
        });

        // Event listener for Build Schema button
        container.querySelector('#build-schema-btn')?.addEventListener('click', () => {
            this.buildSchemaExercises(exerciseContainer, mainFocusSelect.value, subFocusSelect.value);
        });

        // Initial call to set the state of the form
        toggleFreeTrainingMode();
    }

    renderAllExerciseBlocks() {
        if (!this.schema || !this.schema.exercises) return '';
        return this.schema.exercises.map((ex, index) => this._renderExerciseBlockSummary(ex, index)).join('');
    }

    _getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.exercise-block-summary:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    _renderExerciseBlockSummary(exercise, index) {
        let summary = `<strong>${exercise.name || 'Unnamed Exercise'}</strong>`;
        switch (exercise.type) {
            case 'standard':
                summary += ` - ${exercise.sets || '...'} sets, ${exercise.reps || '...'} reps`;
                break;
            case 'timed':
                summary += ` - ${exercise.duration || '...'} duration`;
                break;
            case 'cardio':
                summary += ` - HR Zone: ${exercise.hrZone || '...'}`;
                break;
            case 'breathing':
                summary += ` - ${exercise.duration || '...'}s, Ratio: ${exercise.inhaleRatio || '?'}:${exercise.exhaleRatio || '?'}`;
                break;
            case 'stress':
                summary += ` - ${exercise.duration || '...'}s, Type: ${exercise.measurementType || '...'}`;
                break;
            case 'questionnaire':
                const q = this.app.dataStore.getQuestionnaires().find(q => q.id == exercise.questionnaireId);
                summary = `<strong>Questionnaire:</strong> ${q ? q.name : 'Not selected'}`;
                break;
            case 'profile':
                const p = this.app.dataStore.getProfiles().find(p => p.id == exercise.refId);
                summary = `<strong>Profile Check:</strong> ${p ? p.name : 'Not selected'}`;
                break;
            case 'settings':
                const s = this.app.dataStore.getSettings().find(s => s.id == exercise.refId);
                summary = `<strong>Setting Check:</strong> ${s ? s.name : 'Not selected'}`;
                break;
            default:
                summary += ` - Notes: ${exercise.notes || '...'}`;
                break;
        }

        return `
            <div class="exercise-block-summary" data-index="${index}" draggable="true">
                <div class="summary-text">${summary}</div>
                <div class="summary-actions">
                    <button type="button" class="btn-icon edit-exercise-btn" title="Edit">✏️</button>
                    <button type="button" class="btn-icon remove-exercise-btn" title="Delete">🗑️</button>
                </div>
            </div>
        `;
    }

    _showExerciseModal(index, newType) {
        const isNew = index === null;
        const exercise = isNew ? { type: newType } : { ...this.schema.exercises[index] };

        const title = isNew ? 'Add Exercise Block' : 'Edit Exercise Block';
        const formHtml = this._getExerciseFormHtml(exercise);

        this.app.uiManager.showModal(title, formHtml, () => {
            const modalForm = document.getElementById('exercise-edit-form');
            const formData = new FormData(modalForm);
            const data = Object.fromEntries(formData.entries());

            // Update the exercise object with new data
            Object.assign(exercise, data);

            if (isNew) {
                this.schema.exercises.push(exercise);
            } else {
                this.schema.exercises[index] = exercise;
            }

            document.getElementById('exercise-list-container').innerHTML = this.renderAllExerciseBlocks();
            this.app.uiManager.closeModal();
        });
    }

    _deleteExercise(index) {
        this.schema.exercises.splice(index, 1);
        document.getElementById('exercise-list-container').innerHTML = this.renderAllExerciseBlocks();
    }

    _getExerciseFormHtml(ex = {}) {
        let specificInputs = '';
        switch (ex.type) {
            case 'timed':
                specificInputs = `<div class="form-group"><label>Duration (e.g., 60s)</label><input name="duration" class="form-control" value="${ex.duration || ''}"></div>`;
                break;
            case 'cardio':
                specificInputs = `
                    <div class="form-group"><label>Heart Rate Zone</label><input name="hrZone" class="form-control" placeholder="e.g., Zone 2" value="${ex.hrZone || ''}"></div>
                    <div class="form-group"><label>Watts</label><input name="watts" class="form-control" placeholder="e.g., 150" value="${ex.watts || ''}"></div>
                    <div class="form-group"><label>RPMs</label><input name="rpms" class="form-control" placeholder="e.g., 90" value="${ex.rpms || ''}"></div>
                `;
                break;
            case 'flexibility':
            case 'coordination':
                specificInputs = `<div class="form-group"><label>Notes</label><textarea name="notes" class="form-control" placeholder="e.g., technique, focus points">${ex.notes || ''}</textarea></div>`;
                break;
            case 'profile': {
                const profiles = this.app.dataStore.getProfiles() || [];
                specificInputs = `<div class="form-group"><label>Profile to Check</label><select name="refId" class="form-control">${profiles.map(p => `<option value="${p.id}" ${ex.refId == p.id ? 'selected' : ''}>${p.name}</option>`).join('')}</select></div>`;
                break;
            }
            case 'settings': {
                const settings = this.app.dataStore.getSettings() || [];
                specificInputs = `<div class="form-group"><label>Setting to Check</label><select name="refId" class="form-control">${settings.map(s => `<option value="${s.id}" ${ex.refId == s.id ? 'selected' : ''}>${s.name}</option>`).join('')}</select></div>`;
                break;
            }
            case 'breathing':
                specificInputs = `
                    <div class="form-group"><label>Duration (seconds)</label><input name="duration" class="form-control" value="${ex.duration || '300'}"></div>
                    <div class="form-group"><label>Inhale Ratio</label><input name="inhaleRatio" class="form-control" value="${ex.inhaleRatio || '4'}"></div>
                    <div class="form-group"><label>Exhale Ratio</label><input name="exhaleRatio" class="form-control" value="${ex.exhaleRatio || '6'}"></div>
                `;
                break;
            case 'stress':
                specificInputs = `
                    <div class="form-group"><label>Duration (seconds)</label><input name="duration" class="form-control" value="${ex.duration || '60'}"></div>
                    <div class="form-group"><label>Measurement Type</label><select name="measurementType" class="form-control">
                        <option value="HRV" ${ex.measurementType === 'HRV' ? 'selected' : ''}>HRV</option>
                        <option value="Questionnaire" ${ex.measurementType === 'Questionnaire' ? 'selected' : ''}>Questionnaire</option>
                    </select></div>
                `;
                break;
            case 'questionnaire': {
                const questionnaires = this.app.dataStore.getQuestionnaires() || [];
                specificInputs = `<div class="form-group"><label>Questionnaire</label><select name="questionnaireId" class="form-control">${questionnaires.map(q => `<option value="${q.id}" ${ex.questionnaireId == q.id ? 'selected' : ''}>${q.name}</option>`).join('')}</select></div>`;
                break;
            }
            default: // standard
                specificInputs = `
                    <div class="form-group"><label>Sets</label><input name="sets" class="form-control" placeholder="e.g., 3" value="${ex.sets || ''}"></div>
                    <div class="form-group"><label>Reps</label><input name="reps" class="form-control" placeholder="e.g., 8-12" value="${ex.reps || ''}"></div>
                `;
                break;
        }

        // Common fields for most exercise types
        const nameInputHtml = (ex.type !== 'profile' && ex.type !== 'settings' && ex.type !== 'questionnaire') ? `
            <div class="form-group">
                <label>Exercise Name</label>
                <input name="name" list="exercise-names" class="form-control" placeholder="Exercise Name" value="${ex.name || ''}" required>
                <datalist id="exercise-names">
                    ${exerciseNames.map(name => `<option value="${name}">`).join('')}
                </datalist>
            </div>
        ` : '';

        return `
            <form id="exercise-edit-form">
                <input type="hidden" name="type" value="${ex.type || 'standard'}">
                ${nameInputHtml}
                ${specificInputs}
            </form>
        `;
    }

    buildSchemaExercises(container, mainFocus, subFocus) {
        container.innerHTML = ''; // Clear existing exercises
        let exercisesToAdd = [];

        // Simple logic for now, can be expanded with more sophisticated rules
        if (mainFocus === 'Strength') {
            if (subFocus === 'Max Strength') {
                exercisesToAdd = [
                    { type: "standard", name: "Deadlift", sets: "3", reps: "3-5" },
                    { type: "standard", name: "Bench Press", sets: "3", reps: "3-5" },
                    { type: "standard", name: "Squat", sets: "3", reps: "3-5" },
                ];
            } else if (subFocus === 'Hypertrophy') {
                exercisesToAdd = [
                    { type: "standard", name: "Barbell Row", sets: "4", reps: "8-12" },
                    { type: "standard", name: "Overhead Press", sets: "4", reps: "8-12" },
                    { type: "standard", name: "Bicep Curl", sets: "3", reps: "10-15" },
                    { type: "standard", name: "Tricep Extension", sets: "3", reps: "10-15" },
                ];
            } else if (subFocus === 'Strength Endurance') {
                exercisesToAdd = [
                    { type: "standard", name: "Push-up", sets: "3", reps: "AMRAP" },
                    { type: "standard", name: "Lunge", sets: "3", reps: "15-20" },
                    { type: "timed", name: "Plank", duration: "60s" },
                ];
            }
        } else if (mainFocus === 'Endurance') {
            if (subFocus === 'Cardiovascular') {
                exercisesToAdd = [
                    { type: "cardio", name: "Running", hrZone: "Zone 3", watts: "", rpms: "" },
                    { type: "cardio", name: "Cycling", hrZone: "Zone 2", watts: "150", rpms: "80" },
                    { type: "timed", name: "Jumping Rope", duration: "300s" },
                ];
            } else if (subFocus === 'Muscular') {
                exercisesToAdd = [
                    { type: "standard", name: "Bodyweight Squat", sets: "3", reps: "20" },
                    { type: "standard", name: "Walking Lunge", sets: "3", reps: "10 per leg" },
                    { type: "timed", name: "Wall Sit", duration: "90s" },
                ];
            }
        } else if (mainFocus === 'Speed') {
            if (subFocus === 'Explosiveness') {
                exercisesToAdd = [
                    { type: "coordination", name: "Box Jump", notes: "Focus on explosive take-off" },
                    { type: "coordination", name: "Plyometrics", notes: "Broad jumps" },
                ];
            } else if (subFocus === 'MaxSpeed') {
                exercisesToAdd = [
                    { type: "cardio", name: "Sprinting", hrZone: "Zone 5", watts: "", rpms: "" },
                    { type: "cardio", name: "Hill Sprints", hrZone: "Zone 5", watts: "", rpms: "" },
                ];
            } else if (subFocus === 'Accelerations') {
                exercisesToAdd = [
                    { type: "cardio", name: "Short Sprints", hrZone: "Zone 4", watts: "", rpms: "" },
                    { type: "coordination", name: "Ladder Drills", notes: "Quick feet" },
                ];
            }
        } else if (mainFocus === 'Flexibility') {
            if (subFocus === 'Static') {
                exercisesToAdd = [
                    { type: "flexibility", name: "Hamstring Stretch", notes: "Hold for 30s per leg" },
                    { type: "flexibility", name: "Quad Stretch", notes: "Hold for 30s per leg" },
                    { type: "flexibility", name: "Calf Stretch", notes: "Hold for 30s per leg" },
                ];
            } else if (subFocus === 'Dynamic') {
                exercisesToAdd = [
                    { type: "flexibility", name: "Arm Circles", notes: "Forward and backward" },
                    { type: "flexibility", name: "Leg Swings", notes: "Forward and sideways" },
                ];
            } else if (subFocus === 'PNF') {
                exercisesToAdd = [
                    { type: "flexibility", name: "PNF Hamstring Stretch", notes: "Contract-relax method" },
                ];
            }
        } else if (mainFocus === 'Coordination') {
            if (subFocus === 'Agility') {
                exercisesToAdd = [
                    { type: "coordination", name: "Cone Drills", notes: "Shuttle run" },
                    { type: "coordination", name: "Ladder Drills", notes: "Ickey Shuffle" },
                ];
            } else if (subFocus === 'Balance') {
                exercisesToAdd = [
                    { type: "coordination", name: "Single Leg Balance", notes: "Hold for 30s per leg" },
                    { type: "coordination", name: "Balance Beam", notes: "Walk heel-to-toe" },
                ];
            } else if (subFocus === 'Reaction Time') {
                exercisesToAdd = [
                    { type: "coordination", name: "Reaction Ball Drill", notes: "Quick catches" },
                ];
            }
        } else if (mainFocus === 'Combination') {
            exercisesToAdd = [
                { type: "standard", name: "Burpee", sets: "3", reps: "10" },
                { type: "cardio", name: "Rowing", hrZone: "Zone 3", watts: "", rpms: "" },
                { type: "flexibility", name: "Foam Rolling - Back", notes: "Roll slowly" },
                { type: "coordination", name: "Jump Rope", notes: "Double unders" },
            ];
        }

        exercisesToAdd.forEach(ex => {
            container.insertAdjacentHTML('beforeend', this.renderExerciseRow(ex));
        });

        if (exercisesToAdd.length > 0) {
            this.app.uiManager.showNotification(`Generated ${exercisesToAdd.length} exercises for ${mainFocus} - ${subFocus || ''} schema.`, 'info');
        } else {
            this.app.uiManager.showNotification('No exercises found for the selected focus.', 'warning');
        }
    }

}