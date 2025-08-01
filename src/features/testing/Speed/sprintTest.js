// src/features/testing/speed/sprintTest.js
import LocalizationService from '../../services/localizationServices.js';
import WorkoutTimer from '../../tools/workoutTimer.js';

class SprintTest {
    constructor(goBackCallback) {
        this.container = document.createElement('div');
        this.container.className = 'test-container sprint-test';
        this.goBack = goBackCallback;
        this.workoutTimer = new WorkoutTimer({
            onStop: (time) => this.logTime(time)
        });
    }

    render(mainContentEl) {
        this.container.innerHTML = `
            <div class="test-header">
                <h3>${LocalizationService.t('sprintTest.title')}</h3>
                <button class="button-secondary" id="back-to-hub-btn">${LocalizationService.t('common.back')}</button>
            </div>
            <p>${LocalizationService.t('sprintTest.description')}</p>
            <div id="sprint-timer-container"></div>
            <div id="sprint-result" class="test-result"></div>
        `;
        mainContentEl.appendChild(this.container);
        
        const timerContainer = this.container.querySelector('#sprint-timer-container');
        this.workoutTimer.render(timerContainer);
        this.workoutTimer.changeMode('stopwatch'); // Ensure it starts in stopwatch mode

        this.addEventListeners();
    }

    addEventListeners() {
        this.container.querySelector('#back-to-hub-btn').addEventListener('click', () => this.goBack());
    }

    logTime(time) {
        const resultEl = this.container.querySelector('#sprint-result');
        if (resultEl) {
            resultEl.innerHTML = `<p><strong>${LocalizationService.t('sprintTest.logPrefix')}</strong> ${this.workoutTimer.formatTime(time)}</p>`;
        }
    }

    destroy() {
        if (this.workoutTimer) this.workoutTimer.destroy();
        this.container.innerHTML = '';
    }
}

export default SprintTest;