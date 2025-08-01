// src/features/workout/workoutLoggingHistory.js
import LocalizationService from '../services/localizationServices.js';
import apiService from '../../services/api.js';
import uIManager from '../services/uiManager.js';
import GraphingComponent from '../../components/graphingComponent.js';

class WorkoutLoggingHistoryView {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'workout-logging-history-view';
        this.assignedPlans = [];
        this.workoutHistory = [];
        this.activeWorkoutPlan = null; // The plan being currently logged
        this.handleContainerClick = this.handleContainerClick.bind(this);
        this.handleLogSubmit = this.handleLogSubmit.bind(this);
    }

    async render(mainContentEl) {
        this.container.innerHTML = `
            <div class="view-header">
                <h1>${LocalizationService.t('workoutHistory.title')}</h1>
                <p>${LocalizationService.t('workoutHistory.description')}</p>
            </div>
            <div class="view-body">
                <div id="workout-session-container">
                    <!-- Active workout logging UI will be rendered here -->
                </div>
                <div id="plans-and-history-container">
                    <div class="assigned-plans-section">
                        <h2>${LocalizationService.t('workoutHistory.assignedPlansTitle')}</h2>
                        <div id="assigned-plans-list"></div>
                    </div>
                    <div class="history-section">
                        <h2>${LocalizationService.t('workoutHistory.historyTitle')}</h2>
                        <div id="workout-history-graph" style="width: 100%; height: 300px;"></div>
                        <div id="workout-history-list"></div>
                    </div>
                </div>
                <div id="workout-log-status" class="form-status"></div>
            </div>
        `;
        mainContentEl.appendChild(this.container);
        this.addEventListeners();
        await this._fetchAndRenderData();
    }

    addEventListeners() {
        this.container.addEventListener('click', this.handleContainerClick);
    }

    async _fetchAndRenderData() {
        // Fetch in parallel
        await Promise.all([
            this._fetchAssignedPlans(),
            this._fetchWorkoutHistory()
        ]);
        this._renderAssignedPlans();
        this._renderWorkoutHistory();
    }

    // --- Data Fetching ---
    async _fetchAssignedPlans() {
        const listEl = this.container.querySelector('#assigned-plans-list');
        try {
            this.assignedPlans = await api.get('/api/my-workout-plans.json');
        } catch (error) {
            console.error('Error fetching assigned plans:', error);
            if (listEl) listEl.innerHTML = `<p>${LocalizationService.t('workoutHistory.noAssignedPlans')}</p>`;
        }
    }

    async _fetchWorkoutHistory() {
        const listEl = this.container.querySelector('#workout-history-list');
        try {
            this.workoutHistory = await api.get('/api/workout-logs.json');
        } catch (error) {
            console.error('Error fetching workout history:', error);
            if (listEl) listEl.innerHTML = `<p>${LocalizationService.t('workoutHistory.noHistory')}</p>`;
        }
    }

    // --- UI Rendering ---
    _renderAssignedPlans() {
        const listEl = this.container.querySelector('#assigned-plans-list');
        if (!listEl) return;

        if (this.assignedPlans.length === 0) {
            listEl.innerHTML = `<p>${LocalizationService.t('workoutHistory.noAssignedPlans')}</p>`;
            return;
        }

        listEl.innerHTML = `
            <ul class="item-list">
                ${this.assignedPlans.map(plan => `
                    <li class="list-item">
                        <div>
                            <strong class="item-title">${plan.plan_name}</strong>
                            <span class="item-meta">Assigned by: ${plan.coach_name}</span>
                        </div>
                        <button class="button-primary" data-action="start-workout" data-plan-id="${plan.plan_id}">${LocalizationService.t('workoutHistory.startWorkoutButton')}</button>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    _renderWorkoutHistory() {
        const listEl = this.container.querySelector('#workout-history-list');
        const graphContainer = this.container.querySelector('#workout-history-graph');

        if (!listEl || !graphContainer) return;

        if (this.workoutHistory.length === 0) {
            listEl.innerHTML = `<p>${LocalizationService.t('workoutHistory.noHistory')}</p>`;
            graphContainer.innerHTML = ''; // Clear graph if no history
            return;
        }

        // Prepare data for graphing: total volume per workout session
        const graphData = this.workoutHistory.map((log, index) => {
            let totalVolume = 0;
            log.session_data.forEach(exercise => {
                if (exercise.type === 'standard' && exercise.sets) {
                    exercise.sets.forEach(set => {
                        totalVolume += (set.reps || 0) * (set.weight || 0);
                    });
                }
            });
            return { x: index, y: totalVolume, date: new Date(log.date_logged).toLocaleDateString() };
        }).reverse(); // Reverse to show chronologically on graph

        // Render the graph
        this.workoutGraphComponent = new GraphingComponent('workout-history-graph');
        this.workoutGraphComponent.render(graphData, { xLabel: 'Workout Session', yLabel: 'Total Volume (kg)' });

        // Render the list as before
        listEl.innerHTML = `
            <ul class="history-list">
                ${this.workoutHistory.map(log => `
                    <li class="history-item">
                        <strong>${log.plan_name}</strong>
                        <span>- ${new Date(log.date_logged).toLocaleDateString()}</span>
                        <ul class="history-exercise-summary">
                            ${log.session_data.map(ex => `<li>${ex.exercise_name}: ${ex.sets.length} sets</li>`).join('')}
                        </ul>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    _renderWorkoutLogger(plan) {
        this.activeWorkoutPlan = plan;
        const sessionContainer = this.container.querySelector('#workout-session-container');
        const overviewContainer = this.container.querySelector('#plans-and-history-container');
        
        overviewContainer.style.display = 'none'; // Hide the main view
        sessionContainer.style.display = 'block'; // Show the logger

        const exercisesHtml = plan.exercises.map((ex, index) => {
            if (ex.type === 'standard') {
                return this._renderStandardLoggerRow(ex, index);
            }
            if (ex.type === 'superset') {
                return this._renderSupersetLoggerBlock(ex, index);
            }
            if (ex.type === 'timed') {
                return this._renderTimedLoggerRow(ex, index);
            }
            return '';
        }).join('');

        sessionContainer.innerHTML = `
            <div class="workout-logger-active">
                <h3>${plan.name}</h3>
                <form id="log-workout-form">
                    <div class="exercise-logging-list">
                        ${exercisesHtml}
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="button-primary">${LocalizationService.t('workoutHistory.logWorkoutButton')}</button>
                        <button type="button" class="button-secondary" data-action="cancel-workout">${LocalizationService.t('workoutHistory.cancelWorkoutButton')}</button>
                    </div>
                </form>
            </div>
        `;
        // Add specific listener for the form
        this.container.querySelector('#log-workout-form').addEventListener('submit', this.handleLogSubmit);
    }

    _renderStandardLoggerRow(ex, index) {
        const targetInfo = `Target: ${ex.target_sets || ''} sets, ${ex.target_reps || ''} reps @ ${ex.target_weight || 'bodyweight'}`;
        return `
            <div class="exercise-log-block" data-exercise-id="${ex.exercise_id}" data-exercise-name="${ex.exercise_name}" data-type="standard">
                <h4>${ex.exercise_name}</h4>
                <p class="target-info">${targetInfo}</p>
                <div class="sets-container">
                    <!-- Logged sets will be added here -->
                </div>
                <button type="button" class="button-secondary add-set-btn" data-exercise-index="${index}">Add Set</button>
            </div>
        `;
    }

    _renderSupersetLoggerBlock(superset, index) {
        const exercisesHtml = superset.exercises.map((ex, subIndex) => this._renderStandardLoggerRow(ex, `${index}-${subIndex}`)).join('');
        return `
            <div class="exercise-log-block superset-log-block" data-type="superset">
                <div class="superset-header"><h4>${LocalizationService.t('workoutPlanBuilder.supersetTitle')}</h4></div>
                ${exercisesHtml}
            </div>
        `;
    }

    _renderTimedLoggerRow(ex, index) {
        const targetInfo = `Target: ${ex.target_duration}`;
        return `
            <div class="exercise-log-block" data-exercise-id="${ex.exercise_id}" data-exercise-name="${ex.exercise_name}" data-type="timed">
                <h4>${ex.exercise_name}</h4>
                <p class="target-info">${targetInfo}</p>
                <div class="sets-container">
                    <input type="text" name="duration_logged" placeholder="e.g., 3x 65s" class="log-input">
                </div>
            </div>
        `;
    }

    _renderSetInputRow() {
        return `
            <div class="set-log-row">
                <input type="number" name="reps" placeholder="${LocalizationService.t('workoutPlanBuilder.repsPlaceholder')}" class="log-input">
                <input type="number" step="0.5" name="weight" placeholder="${LocalizationService.t('workoutPlanBuilder.weightPlaceholder')}" class="log-input">
                <button type="button" class="remove-set-btn">&times;</button>
            </div>
        `;
    }

    async handleContainerClick(e) {
        const action = e.target.dataset.action;

        if (action === 'start-workout') {
            const planId = e.target.dataset.planId;
            try {
                const planDetails = await api.get(`/api/workout-plans/${planId}.json`);
                this._renderWorkoutLogger(planDetails);
            } catch (error) {
                console.error(`Error fetching workout plan ${planId}:`, error);
                uIManager.showNotification('Could not load workout plan details.', 'error');
            }
        }

        if (action === 'cancel-workout') {
            this.activeWorkoutPlan = null;
            const sessionContainer = this.container.querySelector('#workout-session-container');
            const overviewContainer = this.container.querySelector('#plans-and-history-container');
            sessionContainer.innerHTML = '';
            sessionContainer.style.display = 'none';
            overviewContainer.style.display = 'block';
        }

        if (e.target.classList.contains('add-set-btn')) {
            const setsContainer = e.target.closest('.exercise-log-block').querySelector('.sets-container');
            setsContainer.insertAdjacentHTML('beforeend', this._renderSetInputRow());
        }

        if (e.target.classList.contains('remove-set-btn')) {
            e.target.closest('.set-log-row').remove();
        }
    }

    async handleLogSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const statusEl = this.container.querySelector('#workout-log-status');
        statusEl.textContent = '';

        const logData = this._parseLogFormToJSON(form);

        try {
            const response = await api.post('/api/workout-logs', logData);
            if (response && response.ok) {
                uIManager.showNotification(LocalizationService.t('workoutHistory.status.logSuccess'), 'success');

                // Add the new log to the top of the history list for immediate feedback.
                // In a real app, we might get the saved log back from the server.
                const newLogEntry = {
                    ...logData,
                    log_id: new Date().getTime(), // mock ID
                    date_logged: new Date().toISOString()
                };
                this.workoutHistory.unshift(newLogEntry);

                this._resetAndRefreshView();
            } else {
                statusEl.textContent = LocalizationService.t('workoutHistory.status.logFailure');
            }
        } catch (error) {
            console.error('Error logging workout:', error);
            statusEl.textContent = LocalizationService.t('workoutHistory.status.logError');
        }
    }

    _parseLogFormToJSON(form) {
        const logData = {
            plan_id: this.activeWorkoutPlan.id,
            plan_name: this.activeWorkoutPlan.name,
            session_data: []
        };

        form.querySelectorAll('.exercise-log-block').forEach(block => {
            // Skip superset containers themselves, as we process their children individually.
            if (block.dataset.type === 'superset') {
                return;
            }

            const exerciseLog = {
                exercise_id: block.dataset.exerciseId,
                exercise_name: block.dataset.exerciseName,
                type: block.dataset.type
            };

            if (exerciseLog.type === 'standard') {
                exerciseLog.sets = [];
                block.querySelectorAll('.set-log-row').forEach(setRow => {
                    const reps = setRow.querySelector('input[name="reps"]').value;
                    const weight = setRow.querySelector('input[name="weight"]').value;
                    if (reps) { // Only add sets that have been filled out
                        exerciseLog.sets.push({
                            reps: parseInt(reps, 10),
                            weight: parseFloat(weight) || 0
                        });
                    }
                });
                // Only add the exercise if at least one set was logged
                if (exerciseLog.sets.length > 0) {
                    logData.session_data.push(exerciseLog);
                }
            } else if (exerciseLog.type === 'timed') {
                const duration = block.querySelector('input[name="duration_logged"]').value;
                if (duration) {
                    exerciseLog.duration_logged = duration;
                    logData.session_data.push(exerciseLog);
                }
            }
        });

        return logData;
    }

    _resetAndRefreshView() {
        this.activeWorkoutPlan = null;
        const sessionContainer = this.container.querySelector('#workout-session-container');
        const overviewContainer = this.container.querySelector('#plans-and-history-container');
        
        if (sessionContainer) {
            sessionContainer.innerHTML = '';
            sessionContainer.style.display = 'none';
        }
        if (overviewContainer) {
            overviewContainer.style.display = 'block';
        }

        // Re-render the history part to show the new entry
        this._renderWorkoutHistory();
    }

    destroy() {
        this.container.removeEventListener('click', this.handleContainerClick);
        const form = this.container.querySelector('#log-workout-form');
        if (form) {
            form.removeEventListener('submit', this.handleLogSubmit);
        }
        this.container.innerHTML = '';
    }
}

export default WorkoutLoggingHistoryView;
