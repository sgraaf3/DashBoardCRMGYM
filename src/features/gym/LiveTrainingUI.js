import LiveHrvAnalysis from './liveHrvAnalysis.js';

/**
 * @class LiveTrainingUI
 * @description Manages the user interface for a live training session,
 *              displaying real-time data like heart rate, and exercise logging.
 */
export default class LiveTrainingUI {
    constructor(app, memberId) {
        this.app = app;
        this.dataStore = app.dataStore;
        this.uIManager = app.uiManager;
        this.bluetoothService = app.bluetoothService;
        this.memberId = memberId;
        this.sessionActive = false;
        this.hrvAnalysis = new LiveHrvAnalysis();

        // Training state management
        this.currentExercise = null;
        this.currentSet = 0;
        this.totalExercises = 0;
        this.completedExercises = 0;
        this.trainingState = 'idle'; // 'idle', 'in_set', 'between_sets', 'between_exercises', 'testing'

        // Bound event handlers for easy add/remove
        this.boundHeartRateHandler = this.handleHeartRateUpdate.bind(this);
        this.boundRrIntervalHandler = this.handleRrIntervalUpdate.bind(this);
        this.boundConnectionHandler = this.handleConnectionStateChange.bind(this);


        // DOM element references
        this.container = null;
        this.hrValueEl = null;
        this.hrvValueEl = null;
        this.startBtnEl = null;
        this.stopBtnEl = null;
        this.exerciseLogContainer = null;
        this.trainingStateEl = null;
        this.progressBarEl = null;
        this.hrChartContainer = null;
        this.hrData = []; // To store HR data for charting
        this.hrvChartContainer = null;
        this.hrvData = []; // To store HRV data for charting
        this.maxDataPoints = 300; // Keep ~5 minutes of data at 1Hz
    }

    /**
     * Cleans up event listeners when the UI component is removed.
     */
    destroy() {
        this.bluetoothService.off('connectionStateChange', this.boundConnectionHandler);
        // If a session is active when destroyed, ensure we unsubscribe from HR updates.
        if (this.sessionActive) {
            this.bluetoothService.off('heartRateUpdate', this.boundHeartRateHandler);
            this.bluetoothService.off('rrIntervalUpdate', this.boundRrIntervalHandler);
            this.hrvAnalysis.reset();
        }
        console.log('LiveTrainingUI destroyed and listeners removed.');
    }

    /**
     * Renders the initial state of the live training UI.
     * @param {HTMLElement} container - The container to render into.
     */
    render(container) {
        this.container = container;
        container.innerHTML = `
            <div class="live-training-card">
                <h3>Live Training Session</h3>
                <div id="live-metrics" class="metrics-grid">
                    <div class="metric-box">
                        <h4>Heart Rate</h4>
                        <p id="hr-value" class="metric-value">-- BPM</p>
                    </div>
                    <div class="metric-box">
                        <h4>HRV (RMSSD)</h4>
                        <p id="hrv-value" class="metric-value">-- ms</p>
                    </div>
                </div>
                <div class="live-controls">
                    <button id="start-session-btn" class="btn btn-success">Start Session</button>
                    <button id="stop-session-btn" class="btn btn-danger" disabled>Stop Session</button>
                </div>

                <div class="training-status">
                    <p>State: <span id="training-state">Idle</span></p>
                    <p>Progress: <span id="exercise-progress">0/0</span></p>
                    <div class="progress-bar-container">
                        <div id="progress-bar" class="progress-bar"></div>
                    </div>
                </div>

                <div id="exercise-logger" class="exercise-logger">
                    <h4>Current Exercise: <span id="current-exercise-name">N/A</span></h4>
                    <div id="strength-logger-controls" style="display: none;">
                        <input type="number" id="set-weight" placeholder="Weight (kg)">
                        <input type="number" id="set-reps" placeholder="Reps">
                        <button id="log-set-btn" class="btn btn-primary">Log Set</button>
                    </div>
                    <div class="training-state-buttons">
                        <button id="btn-in-set" class="btn btn-secondary" data-state="in_set">In Set</button>
                        <button id="btn-between-exercises" class="btn btn-secondary" data-state="between_exercises">Between Exercises</button>
                        <button id="btn-testing" class="btn btn-secondary" data-state="testing">Testing</button>
                    </div>
                    <ul id="logged-sets-list"></ul>
                </div>

                <div id="hr-chart-container" class="hr-chart-container">
                    <!-- HR Chart will be rendered here -->
                </div>
                <div id="hrv-chart-container" class="hrv-chart-container" style="margin-top: 1rem;">
                    <!-- HRV Chart will be rendered here -->
                </div>
                <div id="chart-tooltip" class="chart-tooltip" style="display: none;" role="tooltip"></div>
            </div>
        `;
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Cache DOM elements for performance
        this.hrValueEl = this.container.querySelector('#hr-value');
        this.hrvValueEl = this.container.querySelector('#hrv-value');
        this.startBtnEl = this.container.querySelector('#start-session-btn');
        this.stopBtnEl = this.container.querySelector('#stop-session-btn');
        this.exerciseLogContainer = this.container.querySelector('#exercise-logger');
        this.trainingStateEl = this.container.querySelector('#training-state');
        this.progressBarEl = this.container.querySelector('#progress-bar');
        this.hrChartContainer = this.container.querySelector('#hr-chart-container');
        this.hrvChartContainer = this.container.querySelector('#hrv-chart-container');

        this.startBtnEl.addEventListener('click', () => this.startSession());
        this.stopBtnEl.addEventListener('click', () => this.stopSession());

        // Strength exercise logging controls
        // Listen to the global bluetooth service for connection changes
        this.bluetoothService.on('connectionStateChange', this.boundConnectionHandler);
        // Set the initial state based on the current connection status
        this.handleConnectionStateChange({ state: this.bluetoothService.getState() });
        this.container.querySelector('#log-set-btn')?.addEventListener('click', () => this.logSet());

        // Training state buttons
        this.container.querySelector('#btn-in-set')?.addEventListener('click', () => this.setTrainingState('in_set'));
        this.container.querySelector('#btn-between-exercises')?.addEventListener('click', () => this.setTrainingState('between_exercises'));
        this.container.querySelector('#btn-testing')?.addEventListener('click', () => this.setTrainingState('testing'));
    }

    handleConnectionStateChange({ state }) {
        const isConnected = state === 'connected';
        this.startBtnEl.disabled = !isConnected;
        // The HRV value element should not display connection status.
        // The global floating widget and dashboard widget handle this.
        // We only update the button state here.
        if (!this.sessionActive) {
            this.hrvValueEl.textContent = '-- ms';
        }

        if (!isConnected && this.sessionActive) {
            this.uIManager.showNotification('Device disconnected. Pausing session.', 'warning');
            this.stopSession();
        }
    }

    async startSession() {
        if (this.sessionActive) return;
        if (this.bluetoothService.getState() !== 'connected') {
            this.uIManager.showNotification('Please connect a heart rate monitor using the global widget first.', 'error');
            return;
        }

        this.sessionActive = true;
        console.log(`Starting session for member ${this.memberId}`);

        this.startBtnEl.disabled = true;
        this.stopBtnEl.disabled = false;
        this.setTrainingState('idle'); // Initial state

        // Subscribe to heart rate updates from the global service
        this.bluetoothService.on('heartRateUpdate', this.boundHeartRateHandler);
        this.bluetoothService.on('rrIntervalUpdate', this.boundRrIntervalHandler);
        this.uIManager.showNotification('Live session started!', 'success');
    }

    stopSession() {
        if (!this.sessionActive) return;
        this.sessionActive = false;
        console.log(`Stopping session for member ${this.memberId}`);

        this.startBtnEl.disabled = false;
        this.stopBtnEl.disabled = true;

        // Unsubscribe from heart rate updates, but do NOT disconnect the global device
        this.bluetoothService.off('heartRateUpdate', this.boundHeartRateHandler);
        this.bluetoothService.off('rrIntervalUpdate', this.boundRrIntervalHandler);
        this.hrvAnalysis.reset();

        this.hrValueEl.textContent = `-- BPM`;
        this.hrvValueEl.textContent = `-- ms`;
        this.hrData = [];
        this.hrvData = [];
        this.renderHrChartShell(); // Clear chart
        this.renderHrvChartShell(); // Clear HRV chart

        this.setTrainingState('idle');
        this.currentExercise = null;
        this.currentSet = 0;
        this.completedExercises = 0;
        this.updateProgressBar();
        this.uIManager.showNotification('Live session stopped.', 'info');
    }

    handleHeartRateUpdate(heartRate) {
        this.hrValueEl.textContent = `${heartRate} BPM`;
        const newDataPoint = { timestamp: Date.now(), value: heartRate };
        this.hrData.push(newDataPoint);
        if (this.hrData.length > this.maxDataPoints) {
            this.hrData.shift(); // Remove the oldest data point
        }
        requestAnimationFrame(() => this.updateHrChart());
    }

    handleRrIntervalUpdate(intervals) {
        this.hrvAnalysis.addIntervals(intervals);
        const metrics = this.hrvAnalysis.getMetrics();
        if (metrics && metrics.rmssd) {
            this.hrvValueEl.textContent = `${metrics.rmssd.toFixed(2)} ms`;
            const newDataPoint = { timestamp: Date.now(), value: metrics.rmssd };
            this.hrvData.push(newDataPoint);
            if (this.hrvData.length > this.maxDataPoints / 5) { // HRV is less frequent
                this.hrvData.shift();
            }
            requestAnimationFrame(() => this.updateHrvChart());
        }
    }

    setTrainingState(state) {
        this.trainingState = state;
        this.trainingStateEl.textContent = state.replace(/_/g, ' ').toUpperCase();
        // Optionally, update UI based on state (e.g., highlight active button)
    }

    logSet() {
        const weight = parseFloat(this.container.querySelector('#set-weight').value);
        const reps = parseInt(this.container.querySelector('#set-reps').value);

        if (isNaN(weight) || isNaN(reps) || !this.currentExercise) {
            this.uIManager.showNotification('Please enter valid weight and reps, and select an exercise.', 'warning');
            return;
        }

        const loggedSetsList = this.container.querySelector('#logged-sets-list');
        const listItem = document.createElement('li');
        listItem.textContent = `Set ${this.currentSet + 1}: ${weight} kg x ${reps} reps`;
        loggedSetsList.appendChild(listItem);

        this.currentSet++;
        this.uIManager.showNotification(`Set logged for ${this.currentExercise.name}!`, 'success');
        this.setTrainingState('between_sets'); // After logging a set, usually between sets

        // Clear inputs
        this.container.querySelector('#set-weight').value = '';
        this.container.querySelector('#set-reps').value = '';
    }

    updateProgressBar() {
        const progressText = `${this.completedExercises}/${this.totalExercises}`;
        this.container.querySelector('#exercise-progress').textContent = progressText;
        if (this.totalExercises > 0) {
            const percentage = (this.completedExercises / this.totalExercises) * 100;
            this.progressBarEl.style.width = `${percentage}%`;
        } else {
            this.progressBarEl.style.width = '0%';
        }
    }

    renderHrChartShell() {
        this.hrChartContainer.innerHTML = '';
        const width = this.hrChartContainer.clientWidth || 600;
        const height = 300;

        if (width === 0) {
            return;
        }
        const svgNS = "http://www.w3.org/2000/svg";
        const padding = 40;

        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.id = 'hr-chart-svg';

        // Define HR Zones (example values, these should come from user settings or schema)
        const hrZones = [
            { name: "Zone 1", min: 80, max: 100, color: "#a4d4a4" }, // Light Green
            { name: "Zone 2", min: 101, max: 120, color: "#88cc88" }, // Green
            { name: "Zone 3", min: 121, max: 140, color: "#ffcc66" }, // Yellow
            { name: "Zone 4", min: 141, max: 160, color: "#ff9966" }, // Orange
            { name: "Zone 5", min: 161, max: 180, color: "#ff6666" }  // Red
        ];

        const minHR = 50; // Fixed scale for consistency
        const maxHR = 190;
        const hrRange = maxHR - minHR;

        // Scales
        const yScale = (hrValue) => height - padding - ((hrValue - minHR) / hrRange) * (height - 2 * padding);

        // Draw HR Zone backgrounds
        hrZones.forEach(zone => {
            const y1 = yScale(zone.min);
            const y2 = yScale(zone.max);
            const rect = document.createElementNS(svgNS, "rect");
            rect.setAttribute("x", padding);
            rect.setAttribute("y", Math.min(y1, y2));
            rect.setAttribute("width", width - 2 * padding);
            rect.setAttribute("height", Math.abs(y1 - y2));
            rect.setAttribute("fill", zone.color);
            rect.setAttribute("opacity", "0.2");
            svg.appendChild(rect);

            // Add zone labels
            const text = document.createElementNS(svgNS, "text");
            text.setAttribute("x", width - padding + 5);
            text.setAttribute("y", y2 + (Math.abs(y1 - y2) / 2) + 5); // Center of the zone
            text.setAttribute("fill", "#333");
            text.setAttribute("font-size", "10");
            text.textContent = `${zone.name} (${zone.min}-${zone.max})`;
            svg.appendChild(text);
        });

        // Create an empty path for the HR line, to be updated later
        const path = document.createElementNS(svgNS, "path");
        path.id = 'hr-line-path';
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "blue");
        path.setAttribute("stroke-width", "2");
        svg.appendChild(path);

        // Draw Y-axis (HR values)
        const yAxis = document.createElementNS(svgNS, "line");
        yAxis.setAttribute("x1", padding);
        yAxis.setAttribute("y1", height - padding);
        yAxis.setAttribute("x2", padding);
        yAxis.setAttribute("y2", padding);
        yAxis.setAttribute("stroke", "#333");
        svg.appendChild(yAxis);

        // Y-axis labels
        for (let i = 0; i <= 10; i++) {
            const hrVal = minHR + (hrRange / 10) * i;
            const y = yScale(hrVal);
            const text = document.createElementNS(svgNS, "text");
            text.setAttribute("x", padding - 10);
            text.setAttribute("y", y + 5);
            text.setAttribute("text-anchor", "end");
            text.setAttribute("font-size", "10");
            text.setAttribute("fill", "#333");
            text.textContent = Math.round(hrVal);
            svg.appendChild(text);
        }

        // Draw X-axis (Time)
        const xAxis = document.createElementNS(svgNS, "line");
        xAxis.setAttribute("x1", padding);
        xAxis.setAttribute("y1", height - padding);
        xAxis.setAttribute("x2", width - padding);
        xAxis.setAttribute("y2", height - padding);
        xAxis.setAttribute("stroke", "#333");
        svg.appendChild(xAxis);

        // X-axis labels (simplified for now)
        this.hrChartContainer.appendChild(svg);
    }

    updateHrChart() {
        const svg = this.container.querySelector('#hr-chart-svg');
        const path = this.container.querySelector('#hr-line-path');
        if (!svg || !path || this.hrData.length < 2) {
            if (this.hrData.length === 1) this.renderHrChartShell();
            return;
        }

        const width = this.hrChartContainer.clientWidth || 600;
        const height = 300;
        const padding = 40;

        const minHR = 50;
        const maxHR = 190;
        const hrRange = maxHR - minHR;

        const minTime = this.hrData[0].timestamp;
        const maxTime = this.hrData[this.hrData.length - 1].timestamp;
        const timeRange = maxTime - minTime || 1;

        // Scales
        const xScale = (timestamp) => padding + ((timestamp - minTime) / timeRange) * (width - 2 * padding);
        const yScale = (hrValue) => height - padding - ((hrValue - minHR) / hrRange) * (height - 2 * padding);

        const pathData = this.hrData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.timestamp)} ${yScale(d.value)}`).join(' ');
        path.setAttribute('d', pathData);
    }

    renderHrvChartShell() {
        this.hrvChartContainer.innerHTML = '';
        const width = this.hrvChartContainer.clientWidth || 600;
        const height = 300;
        if (width === 0) return;

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.id = 'hrv-chart-svg';

        const padding = 40;
        const minHrv = 0;
        const maxHrv = 150;
        const hrvRange = maxHrv - minHrv;

        const yScale = (hrvValue) => height - padding - ((hrvValue - minHrv) / hrvRange) * (height - 2 * padding);

        const path = document.createElementNS(svgNS, "path");
        path.id = 'hrv-line-path';
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "#28a745"); // Green for HRV
        path.setAttribute("stroke-width", "2");
        svg.appendChild(path);

        const yAxis = document.createElementNS(svgNS, "line");
        yAxis.setAttribute("x1", padding);
        yAxis.setAttribute("y1", height - padding);
        yAxis.setAttribute("x2", padding);
        yAxis.setAttribute("y2", padding);
        yAxis.setAttribute("stroke", "#333");
        svg.appendChild(yAxis);

        // Y-axis labels
        for (let i = 0; i <= 5; i++) {
            const hrvVal = minHrv + (hrvRange / 5) * i;
            const y = yScale(hrvVal);
            const text = document.createElementNS(svgNS, "text");
            text.setAttribute("x", padding - 10);
            text.setAttribute("y", y + 5);
            text.setAttribute("text-anchor", "end");
            text.setAttribute("font-size", "10");
            text.setAttribute("fill", "#333");
            text.textContent = hrvVal.toFixed(0);
            svg.appendChild(text);
        }

        // Draw X-axis (Time)
        const xAxis = document.createElementNS(svgNS, "line");
        xAxis.setAttribute("x1", padding);
        xAxis.setAttribute("y1", height - padding);
        xAxis.setAttribute("x2", width - padding);
        xAxis.setAttribute("y2", height - padding);
        xAxis.setAttribute("stroke", "#333");
        svg.appendChild(xAxis);
        // Add title
        const title = document.createElementNS(svgNS, "text");
        title.setAttribute("x", width / 2);
        title.setAttribute("y", padding / 2);
        title.setAttribute("text-anchor", "middle");
        title.setAttribute("font-size", "14");
        title.setAttribute("font-weight", "bold");
        title.textContent = "Live HRV (RMSSD)";
        svg.appendChild(title);

        this.hrvChartContainer.appendChild(svg);
    }

    updateHrvChart() {
        const svg = this.container.querySelector('#hrv-chart-svg');
        const path = this.container.querySelector('#hrv-line-path');
        if (!svg || !path || this.hrvData.length < 2) {
            if (this.hrvData.length === 1) this.renderHrvChartShell();
            return;
        }

        const width = this.hrvChartContainer.clientWidth || 600;
        const height = 300;
        const padding = 40;

        const minHrv = 0;
        const maxHrv = 150;
        const hrvRange = maxHrv - minHrv;

        const minTime = this.hrvData[0].timestamp;
        const maxTime = this.hrvData[this.hrvData.length - 1].timestamp;
        const timeRange = maxTime - minTime || 1;

        const xScale = (timestamp) => padding + ((timestamp - minTime) / timeRange) * (width - 2 * padding);
        const yScale = (hrvValue) => height - padding - ((hrvValue - minHrv) / hrvRange) * (height - 2 * padding);

        const pathData = this.hrvData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.timestamp)} ${yScale(d.value)}`).join(' ');
        path.setAttribute("d", pathData);
    }

    // Method to set the current exercise and update UI
    setCurrentExercise(exercise) {
        this.currentExercise = exercise;
        this.currentSet = 0; // Reset set count for new exercise
        this.container.querySelector('#current-exercise-name').textContent = exercise ? exercise.name : 'N/A';
        this.container.querySelector('#logged-sets-list').innerHTML = ''; // Clear previous sets

        if (exercise && (exercise.type === 'standard' || exercise.type === 'superset')) {
            this.container.querySelector('#strength-logger-controls').style.display = 'block';
        } else {
            this.container.querySelector('#strength-logger-controls').style.display = 'none';
        }
    }

    // Call this when an exercise is completed
    completeExercise() {
        this.completedExercises++;
        this.updateProgressBar();
        this.uIManager.showNotification(`Exercise "${this.currentExercise.name}" completed!`, 'info');
        this.setTrainingState('between_exercises');
    }

    // Call this to set total exercises at the start of a session
    setTotalExercises(count) {
        this.totalExercises = count;
        this.updateProgressBar();
    }
}