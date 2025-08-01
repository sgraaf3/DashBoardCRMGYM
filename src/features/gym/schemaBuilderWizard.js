import { exerciseNames } from '../../data/exerciseData.js';

export default class SchemaBuilderView {
    constructor(app) {
        this.app = app;
    }

    render(container, schema, onSave) {
        const isEditing = !!schema;
        const title = isEditing ? 'Edit Workout Schema' : 'Create New Workout Schema';

        const existingExercisesHtml = schema?.exercises.map(ex => this.renderExerciseRow(ex)).join('') || '';

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

    addEventListeners(container, schema, onSave) {
        const form = container.querySelector('#schema-builder-form');
        const exerciseContainer = container.querySelector('#exercise-list-container');

        container.querySelector('#add-exercise-btn')?.addEventListener('click', () => {
            const selectedType = container.querySelector('#exercise-type-select').value;
            exerciseContainer.insertAdjacentHTML('beforeend', this.renderExerciseRow({ type: selectedType }));
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
                isPreset: form.querySelector('#type-preset').checked,
                useHrm: form.querySelector('#use-hrm').checked,
                mainFocus: form.querySelector('#main-focus').value,
                subFocus: form.querySelector('#sub-focus').value,
                preselectionNotes: form.querySelector('#preselection-notes').value,
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
                } else if (type === 'cardio') {
                    const hrZoneInput = block.querySelector('input[name="ex-hrZone"]');
                    const wattsInput = block.querySelector('input[name="ex-watts"]');
                    const rpmsInput = block.querySelector('input[name="ex-rpms"]');
                    exercise.hrZone = hrZoneInput ? hrZoneInput.value : '';
                    exercise.watts = wattsInput ? wattsInput.value : '';
                    exercise.rpms = rpmsInput ? rpmsInput.value : '';
                } else if (type === 'flexibility' || type === 'coordination') {
                    const notesInput = block.querySelector('textarea[name="ex-notes"]');
                    exercise.notes = notesInput ? notesInput.value : '';
                }
                schemaData.exercises.push(exercise);
            });

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


    renderExerciseRow(ex = {}) {
        let specificInputs = '';
        switch (ex.type) {
            case 'timed':
                specificInputs = `<input name="ex-duration" placeholder="Duration (e.g., 60s)" value="${ex.duration || ''}">`;
                break;
            case 'cardio':
                specificInputs = `
                    <input name="ex-hrZone" placeholder="Heart Rate Zone" value="${ex.hrZone || ''}">
                    <input name="ex-watts" placeholder="Watts" value="${ex.watts || ''}">
                    <input name="ex-rpms" placeholder="RPMs" value="${ex.rpms || ''}">
                `;
                break;
            case 'flexibility':
            case 'coordination':
                specificInputs = `<textarea name="ex-notes" placeholder="Notes (e.g., technique, focus points)">${ex.notes || ''}</textarea>`;
                break;
            default: // standard
                specificInputs = `
                    <input name="ex-sets" placeholder="Sets" value="${ex.sets || ''}">
                    <input name="ex-reps" placeholder="Reps" value="${ex.reps || ''}">
                `;
                break;
        }

        return `
            <div class="exercise-block" data-type="${ex.type || 'standard'}">
                <div class="exercise-inputs">
                    <input name="ex-name" list="exercise-names" placeholder="Exercise Name" value="${ex.name || ''}" required>
                    <datalist id="exercise-names">
                        ${exerciseNames.map(name => `<option value="${name}">`).join('')}
                    </datalist>
                    ${specificInputs}
                </div>
                <button type="button" class="btn btn-danger remove-exercise-btn">&times;</button>
            </div>
        `;
    }
}