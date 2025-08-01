class WorkoutTimer {
    constructor() {
        this.mode = 'stopwatch';
        this.state = 'idle';
        this.timerInterval = null;
        this.timeValue = 0;
        this.laps = [];
    }
    render(container) {
        container.innerHTML = `
            <div class="tool-card">
                <h3>Workout Timer</h3>
                <div class="timer-display" id="timer-display">00:00:00</div>
                <div class="timer-controls" id="timer-controls"></div>
                <ul class="lap-list" id="timer-laps"></ul>
            </div>
        `;
        this.display = container.querySelector('#timer-display');
        this.controls = container.querySelector('#timer-controls');
        this.lapList = container.querySelector('#timer-laps');
        this.renderControls();
    }
    renderControls() {
        if (this.state === 'running') {
            this.controls.innerHTML = `
                <button class="btn btn-danger" data-action="stop">Stop</button>
                <button class="btn" data-action="lap">Lap</button>
            `;
        } else if (this.state === 'paused') {
            this.controls.innerHTML = `
                <button class="btn btn-primary" data-action="start">Resume</button>
                <button class="btn" data-action="reset">Reset</button>
            `;
        } else { 
            this.controls.innerHTML = `
                <button class="btn btn-primary" data-action="start">Start</button>
                <button class="btn" data-action="reset" disabled>Reset</button>
            `;
        }
        this.controls.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleControl(e.target.dataset.action));
        });
    }
    handleControl(action) {
        switch (action) {
            case 'start': this.start(); break;
            case 'stop': this.stop(); break;
            case 'reset': this.reset(); break;
            case 'lap': this.addLap(); break;
        }
    }
    start() {
        if (this.state === 'running') return;
        this.state = 'running';
        let lastTick = Date.now();
        this.timerInterval = setInterval(() => {
            const now = Date.now();
            this.timeValue += (now - lastTick);
            lastTick = now;
            this.updateDisplay();
        }, 100);
        this.renderControls();
    }
    stop() {
        this.state = 'paused';
        clearInterval(this.timerInterval);
        this.renderControls();
    }
    reset() {
        this.state = 'idle';
        clearInterval(this.timerInterval);
        this.timeValue = 0;
        this.laps = [];
        this.lapList.innerHTML = '';
        this.updateDisplay();
        this.renderControls();
    }
    addLap() {
        if (this.state !== 'running') return;
        this.laps.push(this.timeValue);
        const li = document.createElement('li');
        li.textContent = `Lap ${this.laps.length}: ${this.formatTime(this.timeValue)}`;
        this.lapList.prepend(li);
    }
    updateDisplay() {
        this.display.textContent = this.formatTime(this.timeValue);
    }
    formatTime(ms) {
        const time = new Date(ms);
        const minutes = String(time.getUTCMinutes()).padStart(2, '0');
        const seconds = String(time.getUTCSeconds()).padStart(2, '0');
        const centiseconds = String(Math.floor(time.getUTCMilliseconds() / 10)).padStart(2, '0');
        return `${minutes}:${seconds}:${centiseconds}`;
    }
}

export default WorkoutTimer;