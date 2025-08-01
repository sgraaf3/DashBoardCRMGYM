

let savedPlans = {};

/**
 * Initializes all functionality for the Workout Builder widget.
 * @param {function} showNotification - The global notification function.
 */
export function initBuilder(showNotification) {
    const library = document.getElementById('exercise-library');
    const planDropZone = document.getElementById('plan-drop-zone');
    const savePlanBtn = document.getElementById('save-plan-btn');
    const savedPlansList = document.getElementById('saved-plans-list');

    const renderSavedPlans = () => {
        savedPlansList.innerHTML = '';
        for (const planName in savedPlans) {
            const li = document.createElement('li');
            li.className = 'saved-plan-item';
            li.innerHTML = `<span>${planName}</span><div class="plan-actions"><button class="action-btn load-plan-btn" data-plan-name="${planName}" title="Load"><i class="fas fa-upload"></i></button><button class="action-btn delete-plan-btn" data-plan-name="${planName}" title="Delete"><i class="fas fa-trash"></i></button></div>`;
            savedPlansList.appendChild(li);
        }
    };

    savePlanBtn.addEventListener('click', async (e) => {
        const planName = prompt('Enter a name for this plan:');
        if (!planName) return;
        const planData = {};
        planDropZone.querySelectorAll('.day-schedule').forEach(day => {
            planData[day.dataset.day] = Array.from(day.querySelectorAll('.exercise-item')).map(el => el.textContent);
        });
        
        const btn = e.currentTarget;
        btn.disabled = true;
        
        try {
            await apiService.saveWorkoutPlan(planName, planData);
            savedPlans[planName] = planData; // Update local state after successful save
            renderSavedPlans();
            showNotification(`Plan '${planName}' saved.`);
        } catch (error) {
            showNotification('Failed to save plan.', 'error');
        } finally {
            btn.disabled = false;
        }
    });

    savedPlansList.addEventListener('click', async (e) => {
        const planName = e.target.closest('[data-plan-name]')?.dataset.planName;
        if (!planName) return;

        if (e.target.closest('.load-plan-btn')) {
            const planData = savedPlans[planName];
            planDropZone.querySelectorAll('.day-schedule').forEach(day => {
                day.innerHTML = `<h5>${day.dataset.day}</h5>`;
                (planData[day.dataset.day] || []).forEach(exName => {
                    const el = document.createElement('div');
                    el.className = 'exercise-item';
                    el.textContent = exName;
                    day.appendChild(el);
                });
            });
            showNotification(`Plan '${planName}' loaded.`);
        } else if (e.target.closest('.delete-plan-btn')) {
            try {
                await apiService.deleteWorkoutPlan(planName);
                delete savedPlans[planName]; // Update local state
                renderSavedPlans();
                showNotification(`Plan '${planName}' deleted.`, 'error');
            } catch (error) {
                showNotification('Failed to delete plan.', 'error');
            }
        }
    });

    library.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('exercise-item')) {
            e.dataTransfer.setData('text/plain', e.target.textContent);
            e.target.classList.add('dragging');
        }
    });
    library.addEventListener('dragend', (e) => e.target.classList.remove('dragging'));

    planDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        const targetDay = e.target.closest('.day-schedule');
        if (targetDay) targetDay.classList.add('drag-over');
    });
    planDropZone.addEventListener('dragleave', (e) => e.target.closest('.day-schedule')?.classList.remove('drag-over'));
    planDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetDay = e.target.closest('.day-schedule');
        if (targetDay) {
            targetDay.classList.remove('drag-over');
            const exerciseName = e.dataTransfer.getData('text/plain');
            const el = document.createElement('div');
            el.className = 'exercise-item';
            el.textContent = exerciseName;
            targetDay.appendChild(el);
        }
    });

    // Initial load of saved plans
    const loadInitialPlans = async () => {
        const savedPlansWidget = document.getElementById('saved-plans-widget');
        savedPlansWidget.classList.add('is-loading');
        try {
            const plans = await apiService.getWorkoutPlans();
            savedPlans = plans;
            renderSavedPlans();
        } catch (error) {
            showNotification('Failed to load saved plans.', 'error');
        } finally {
            savedPlansWidget.classList.remove('is-loading');
        }
    };

    loadInitialPlans();
}