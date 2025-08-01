class ReactionTimeGame {
    constructor() {
        this.state = 'waiting';
        this.timeoutId = null;
        this.startTime = 0;
    }
    render(container) {
        container.innerHTML = `
            <div class="tool-card">
                <h3>Reaction Time</h3>
                <div class="reaction-display waiting" id="reaction-box"><div id="reaction-text">Click to Start</div></div>
            </div>
        `;
        this.display = container.querySelector('#reaction-box');
        this.displayText = container.querySelector('#reaction-text');
        this.display.addEventListener('click', () => this.handleClick());
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
        this.displayText.textContent = 'Wait for green...';
        this.timeoutId = setTimeout(() => {
            this.state = 'ready';
            this.display.className = 'reaction-display ready';
            this.displayText.textContent = 'Click NOW!';
            this.startTime = Date.now();
        }, Math.random() * 2000 + 1000);
    }
    tooSoon() {
        clearTimeout(this.timeoutId);
        this.state = 'clicked';
        this.display.className = 'reaction-display waiting';
        this.displayText.textContent = 'Too soon! Click to try again.';
    }
    recordTime() {
        const reactionTime = Date.now() - this.startTime;
        this.state = 'clicked';
        this.display.className = 'reaction-display clicked';
        this.displayText.innerHTML = `${reactionTime} ms<br><small>Click to restart</small>`;
    }
}

export default ReactionTimeGame;