/**
 * This file manages the Schema Builder modal, allowing for the creation
 * of complex workout schemas including standard exercises, supersets, and timed intervals.
 */

import dataStore from "../../core/dataStore.js";
import uIManager from "../services/uiManager.js";

export function showSchemaBuilder(schemaToEdit = null) {
    
    const isEditMode = !!schemaToEdit;
    const title = isEditMode ? 'Edit Workout Schema' : 'Create New Workout Schema';

    const modalContent = `
        <form id="schema-builder-form">
            <input type="hidden" name="id" value="${schemaToEdit?.id || ''}">
            <div class="form-group">
                <label for="schema-name">Schema Name</label>
                <input type="text" id="schema-name" name="name" value="${schemaToEdit?.name || ''}" required>
            </div>
            <div class="form-group">
                <label for="schema-description">Description</label>
                <textarea id="schema-description" name="description">${schemaToEdit?.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label for="schema-member">Assign to Member</label>
                <select id="schema-member" name="memberId">
                    <option value="">-- Select a Member --</option>
                    ${dataStore.getMembers().map(member => `<option value="${member.id}" ${schemaToEdit?.memberId == member.id ? 'selected' : ''}>${member.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="schema-goal">Goal</label>
                <input type="text" id="schema-goal" name="goal" value="${schemaToEdit?.goal || ''}">
            </div>

            <div id="exercise-list-container" class="exercise-list-container">
                <h3>Exercises</h3>
                <!-- Exercises will be rendered here -->
            </div>

            <div class="form-actions">
                <div class="dropdown">
                    <button type="button" class="button-primary dropdown-toggle">Add Exercise</button>
                    <div class="dropdown-menu">
                        <a href="#" data-type="standard">Standard</a>
                        <a href="#" data-type="superset">Superset</a>
                        <a href="#" data-type="timed">Timed Interval</a>
                    </div>
                </div>
                <button type="submit" class="button-primary">${isEditMode ? 'Update' : 'Save'} Schema</button>
            </div>
        </form>
    `;

    // This assumes a uIManager that can show a large modal
        // uIManager.showModal(title, modalContent, true); // true for large modal
    addEventListeners();

    // If editing, render existing exercises
    if (isEditMode && schemaToEdit.exercises) {
        schemaToEdit.exercises.forEach(renderExercise);
    }
}

function addEventListeners() {
    const form = document.getElementById('schema-builder-form');
    form.addEventListener('submit', handleSave);

    form.querySelector('.dropdown-menu').addEventListener('click', (e) => {
        e.preventDefault();
        if (e.target.tagName === 'A') {
            renderExercise({ type: e.target.dataset.type });
        }
    });

    form.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-exercise-btn')) {
            e.target.closest('.exercise-block').remove();
        }
        if (e.target.classList.contains('add-to-superset-btn')) {
            const supersetExercises = e.target.closest('.superset-block').querySelector('.superset-exercises');
            supersetExercises.insertAdjacentHTML('beforeend', renderStandardRow());
        }
    });
}

function renderExercise(exercise) {
    const container = document.getElementById('exercise-list-container');
    let html;
    switch (exercise.type) {
        case 'superset':
            html = renderSupersetBlock(exercise);
            break;
        case 'timed':
            html = renderTimedRow(exercise);
            break;
        default:
            html = renderStandardRow(exercise);
    }
    container.insertAdjacentHTML('beforeend', html);
}

function renderStandardRow(ex = {}) {
    return `<div class="exercise-block standard-row" data-type="standard">
        <input type="text" name="ex-name" placeholder="Exercise Name" value="${ex.name || ''}" required>
        <input type="text" name="ex-sets" placeholder="Sets" value="${ex.sets || ''}">
        <input type="text" name="ex-reps" placeholder="Reps" value="${ex.reps || ''}">
        <input type="text" name="ex-weight" placeholder="Weight" value="${ex.weight || ''}">
        <button type="button" class="remove-exercise-btn">&times;</button>
    </div>`;
}

function renderTimedRow(ex = {}) {
    return `<div class="exercise-block timed-row" data-type="timed">
        <input type="text" name="ex-name" placeholder="Exercise Name" value="${ex.name || ''}" required>
        <input type="text" name="ex-duration" placeholder="Duration (e.g., 60s)" value="${ex.duration || ''}">
        <textarea name="ex-notes" placeholder="Notes...">${ex.notes || ''}</textarea>
        <button type="button" class="remove-exercise-btn">&times;</button>
    </div>`;
}

function renderSupersetBlock(ex = {}) {
    const innerExercises = ex.exercises ? ex.exercises.map(renderStandardRow).join('') : renderStandardRow();
    return `<div class="exercise-block superset-block" data-type="superset">
        <div class="superset-header">
            <h4>Superset</h4>
            <button type="button" class="remove-exercise-btn">&times;</button>
        </div>
        <div class="superset-exercises">${innerExercises}</div>
        <button type="button" class="button-secondary add-to-superset-btn">Add Exercise to Superset</button>
    </div>`;
}

function handleSave(e) {
    e.preventDefault();
    const form = e.target;
    const schemaData = {
        id: form.querySelector('input[name="id"]').value,
        name: form.querySelector('input[name="name"]').value,
        description: form.querySelector('textarea[name="description"]').value,
        memberId: form.querySelector('select[name="memberId"]').value,
        goal: form.querySelector('input[name="goal"]').value,
        exercises: []
    };

    document.querySelectorAll('.exercise-block').forEach(block => {
        const type = block.dataset.type;
        if (type === 'standard' || type === 'timed') {
            const inputs = block.querySelectorAll('input, textarea');
            const exercise = { type };
            inputs.forEach(input => {
                const key = input.name.replace('ex-', '');
                exercise[key] = input.value;
            });
            schemaData.exercises.push(exercise);
        } else if (type === 'superset') {
            const superset = { type: 'superset', exercises: [] };
            block.querySelectorAll('.standard-row').forEach(row => {
                const inputs = row.querySelectorAll('input');
                const exercise = { type: 'standard' };
                inputs.forEach(input => {
                    const key = input.name.replace('ex-', '');
                    exercise[key] = input.value;
                });
                superset.exercises.push(exercise);
            });
            schemaData.exercises.push(superset);
        }
    });

    dataStore.saveWorkoutSchema(schemaData);
    uIManager.hideModal();
    uIManager.showNotification('Schema saved successfully!', 'success');
}