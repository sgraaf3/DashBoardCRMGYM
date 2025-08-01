// src/features/testing/tools/reactionTimeGame.js
import LocalizationService from '../../services/localizationServices.js';

class ReactionTimeGame {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'reaction-game-tool';

        this.state = 'waiting'; // 'waiting', 'preparing', 'ready', 'clicked', 'too-soon'
        this.timeoutId = null;
        this.startTime = 0;

        this.boundHandleClick = this.handleClick.bind(this);
    }

    render(parentElement) {
        this.container.innerHTML = `
            <div class="reaction-display waiting">
                <div class="reaction-text">${LocalizationService.t('reactionGame.clickToStart')}</div>
            </div>
        `;
        parentElement.appendChild(this.container);
        this.display = this.container.querySelector('.reaction-display');
        this.displayText = this.container.querySelector('.reaction-text');
        this.addEventListeners();
    }

    addEventListeners() {
        this.display.addEventListener('click', this.boundHandleClick);
    }

    handleClick() {
        switch (this.state) {
            case 'waiting':
            case 'clicked':
                this.prepare();
                break;
            case 'preparing':
                this.tooSoon();
                break;
            case 'ready':
                this.recordTime();
                break;
        }
    }

    prepare() {
        this.state = 'preparing';
        this.display.className = 'reaction-display preparing';
        this.displayText.textContent = LocalizationService.t('reactionGame.wait');

        const delay = Math.random() * 3000 + 1000; // 1-4 second delay
        this.timeoutId = setTimeout(() => {
            this.state = 'ready';
            this.display.className = 'reaction-display ready';
            this.displayText.textContent = LocalizationService.t('reactionGame.clickNow');
            this.startTime = Date.now();
        }, delay);
    }

    tooSoon() {
        clearTimeout(this.timeoutId);
        this.state = 'clicked';
        this.display.className = 'reaction-display too-soon';
        this.displayText.textContent = LocalizationService.t('reactionGame.tooSoon');
    }

    recordTime() {
        const reactionTime = Date.now() - this.startTime;
        this.state = 'clicked';
        this.display.className = 'reaction-display clicked';
        this.displayText.innerHTML = `${reactionTime} ms<br><small>${LocalizationService.t('reactionGame.clickToRestart')}</small>`;
    }

    destroy() {
        clearTimeout(this.timeoutId);
        this.display.removeEventListener('click', this.boundHandleClick);
        this.container.innerHTML = '';
    }
}

export default ReactionTimeGame;