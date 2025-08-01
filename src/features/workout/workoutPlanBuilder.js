// src/features/workout/workoutPlanBuilder.js
import LocalizationService from '../services/localizationServices.js';
import api from '../../services/api.js';
import uIManager from '../services/uiManager.js';

class WorkoutPlanBuilderView {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'workout-plan-builder-view';
        this.availableExercises = [];
        this.handleContainerClick = this.handleContainerClick.bind(this);
        this.handlePlanSubmit = this.handlePlanSubmit.bind(this);
    }

    async render(mainContentEl) {
        await this._fetchAndCacheExercises();

        this.container.innerHTML = `
            <div class="view-header">
                <h1>${LocalizationService.t('workoutPlanBuilder.title')}</h1>
                <p>${LocalizationService.t('workoutPlanBuilder.description')}</p>
            </div>
            <div class="view-body">
                <form id="workout-plan-form">
                    <div class="form-group">
                        <label for="plan-name">${LocalizationService.t('workoutPlanBuilder.planNameLabel')}</label>
                        <input type="text" id="plan-name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="plan-description">${LocalizationService.t('workoutPlanBuilder.planDescriptionLabel')}</label>
                        <textarea id="plan-description" name="description"></textarea>
                    </div>

                    <div id="exercise-list-container" class="exercise-list-container">
                        <h3>${LocalizationService.t('workoutPlanBuilder.exercisesTitle')}</h3>
                        <!-- Exercises will be rendered here -->
                    </div>

                    <div class="form-actions">
                        <div class="dropdown">
                            <button type="button" class="button-primary dropdown-toggle">${LocalizationService.t('workoutPlanBuilder.addExerciseButton')}</button>
                            <div class="dropdown-menu">
                                <a href="#" data-type="standard">${LocalizationService.t('workoutPlanBuilder.addStandard')}</a>
                                <a href="#" data-type="superset">${LocalizationService.t('workoutPlanBuilder.addSuperset')}</a>
                                <a href="#" data-type="timed">${LocalizationService.t('workoutPlanBuilder.addTimed')}</a>
                            </div>
                        </div>
                        <button type="submit" class="button-primary">${LocalizationService.t('workoutPlanBuilder.savePlanButton')}</button>
                    </div>
                     <div id="workout-plan-status" class="form-status"></div>
                </form>
            </div>
        `;
        mainContentEl.appendChild(this.container);
        this.addEventListeners();
    }

    _renderExercise(type) {
        const container = this.container.querySelector('#exercise-list-container');
        let html;
        switch (type) {
            case 'superset':
                html = this._renderSupersetBlock();
                break;
            case 'timed':
                html = this._renderTimedRow();
                break;
            default:
                html = this._renderStandardRow();
        }
        container.insertAdjacentHTML('beforeend', html);
    }

    _renderExerciseSelect(selectedId = '') {
        if (this.availableExercises.length === 0) {
            return `<p>${LocalizationService.t('workoutPlanBuilder.status.noExercises')}</p>`;
        }
        let options = `<option value="">${LocalizationService.t('workoutPlanBuilder.selectExercisePlaceholder')}</option>`;
        this.availableExercises.forEach(ex => {
            options += `<option value="${ex.id}" ${ex.id == selectedId ? 'selected' : ''}>${ex.name}</option>`;
        });
        return `<select name="ex-id" required>${options}</select>`;
    }

    _renderStandardRow(ex = {}) {
        return `<div class="exercise-block standard-row" data-type="standard">
            ${this._renderExerciseSelect(ex.id)}
            <input type="text" name="ex-sets" placeholder="${LocalizationService.t('workoutPlanBuilder.setsPlaceholder')}" value="${ex.sets || ''}">
            <input type="text" name="ex-reps" placeholder="${LocalizationService.t('workoutPlanBuilder.repsPlaceholder')}" value="${ex.reps || ''}">
            <input type="text" name="ex-weight" placeholder="${LocalizationService.t('workoutPlanBuilder.weightPlaceholder')}" value="${ex.weight || ''}">
            <button type="button" class="remove-exercise-btn">&times;</button>
        </div>`;
    }

    _renderTimedRow(ex = {}) {
        return `<div class="exercise-block timed-row" data-type="timed">
            ${this._renderExerciseSelect(ex.id)}
            <input type="text" name="ex-duration" placeholder="${LocalizationService.t('workoutPlanBuilder.durationPlaceholder')}" value="${ex.duration || ''}">
            <textarea name="ex-notes" placeholder="${LocalizationService.t('workoutPlanBuilder.notesPlaceholder')}">${ex.notes || ''}</textarea>
            <button type="button" class="remove-exercise-btn">&times;</button>
        </div>`;
    }

    _renderSupersetBlock(ex = {}) {
        const innerExercises = ex.exercises ? ex.exercises.map(e => this._renderStandardRow(e)).join('') : this._renderStandardRow();
        return `<div class="exercise-block superset-block" data-type="superset">
            <div class="superset-header">
                <h4>${LocalizationService.t('workoutPlanBuilder.supersetTitle')}</h4>
                <button type="button" class="remove-exercise-btn">&times;</button>
            </div>
            <div class="superset-exercises">${innerExercises}</div>
            <button type="button" class="button-secondary add-to-superset-btn">${LocalizationService.t('workoutPlanBuilder.addToSupersetButton')}</button>
        </div>`;
    }

    addEventListeners() {
        const form = this.container.querySelector('#workout-plan-form');
        if (form) {
            form.addEventListener('submit', this.handlePlanSubmit);
            form.addEventListener('click', this.handleContainerClick);
        }
    }

    handleContainerClick(e) {
        // Dropdown toggle
        if (e.target.classList.contains('dropdown-toggle')) {
            e.target.nextElementSibling.classList.toggle('show');
        }

        // Add exercise from dropdown
        if (e.target.closest('.dropdown-menu') && e.target.tagName === 'A') {
            e.preventDefault();
            this._renderExercise(e.target.dataset.type);
            e.target.closest('.dropdown-menu').classList.remove('show');
        }

        // Remove exercise block
        if (e.target.classList.contains('remove-exercise-btn')) {
            e.target.closest('.exercise-block').remove();
        }

        // Add exercise to superset
        if (e.target.classList.contains('add-to-superset-btn')) {
            const supersetExercises = e.target.closest('.superset-block').querySelector('.superset-exercises');
            supersetExercises.insertAdjacentHTML('beforeend', this._renderStandardRow());
        }
    }

    async _fetchAndCacheExercises() {
        const statusEl = this.container.querySelector('#workout-plan-status');
        try {
            const exercises = await api.get('/api/exercises');
            this.availableExercises = exercises || [];
        } catch (error) {
            console.error('Failed to fetch exercises:', error);
            if (statusEl) statusEl.textContent = LocalizationService.t('workoutPlanBuilder.status.noExercises');
            this.availableExercises = [];
        }
    }

    async handlePlanSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const planData = this._parseDomToPlanData(form);
        const statusEl = this.container.querySelector('#workout-plan-status');

        if (!planData.name) {
            statusEl.textContent = LocalizationService.t('workoutPlanBuilder.status.noName');
            return;
        }

        try {
            // This now calls the real backend API
            const response = await api.post('/api/workout-plans', planData);
            if (response && response.ok) {
                statusEl.textContent = LocalizationService.t('workoutPlanBuilder.status.success');
                uIManager.showNotification(LocalizationService.t('workoutPlanBuilder.status.success'), 'success');
                form.reset();
                this.container.querySelector('#exercise-list-container').innerHTML = `<h3>${LocalizationService.t('workoutPlanBuilder.exercisesTitle')}</h3>`; // Clear exercises
            } else {
                statusEl.textContent = LocalizationService.t('workoutPlanBuilder.status.failure');
            }
        } catch (error) {
            console.error('Error saving workout plan:', error);
            statusEl.textContent = LocalizationService.t('workoutPlanBuilder.status.error');
        }
    }

    _parseDomToPlanData(form) {
        const planData = {
            name: form.querySelector('input[name="name"]').value,
            description: form.querySelector('textarea[name="description"]').value,
            exercises: []
        };

        this.container.querySelectorAll('#exercise-list-container > .exercise-block').forEach(block => {
            const type = block.dataset.type;
            if (type === 'standard' || type === 'timed') {
                const exercise = { type };
                const select = block.querySelector('select[name="ex-id"]');
                if (select) exercise.exercise_id = select.value;

                block.querySelectorAll('input, textarea').forEach(input => {
                    const key = input.name.replace('ex-', '');
                    if (key !== 'id') exercise[key] = input.value;
                });
                planData.exercises.push(exercise);
            } else if (type === 'superset') {
                const superset = { type: 'superset', exercises: [] };
                block.querySelectorAll('.standard-row').forEach(row => {
                    const exercise = { type: 'standard' };
                    const select = row.querySelector('select[name="ex-id"]');
                    if (select) exercise.exercise_id = select.value;

                    row.querySelectorAll('input').forEach(input => {
                        const key = input.name.replace('ex-', '');
                        if (key !== 'id') exercise[key] = input.value;
                    });
                    superset.exercises.push(exercise);
                });
                planData.exercises.push(superset);
            }
        });

        return planData;
    }

    destroy() {
        const form = this.container.querySelector('#workout-plan-form');
        if (form) {
            form.removeEventListener('submit', this.handlePlanSubmit);
            form.removeEventListener('click', this.handleContainerClick);
        }
        this.container.innerHTML = '';
    }
}

export default WorkoutPlanBuilderView;
