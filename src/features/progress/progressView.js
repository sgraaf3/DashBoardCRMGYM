class ProgressView {
    constructor(app) {
        this.app = app;
        this.chartContainer = null;
    }

    render(container) {
        const user = this.app.authManager.getCurrentUser();
        const workoutLogs = this.app.dataStore.getWorkoutLogsForUser(user.id) || [];

        const exerciseNames = new Set();
        workoutLogs.forEach(log => {
            if (log.exercises) {
                log.exercises.forEach(ex => exerciseNames.add(ex.name));
            }
        });

        const uniqueExercises = [...exerciseNames].sort();

        container.innerHTML = `
            <div class="view-header"><h1>My Progress</h1></div>
            <div class="widget">
                <div class="progress-controls">
                    <label for="exercise-select">Select Exercise:</label>
                    <select id="exercise-select" class="form-control">
                        <option value="">--Choose an exercise--</option>
                        ${uniqueExercises.map(name => `<option value="${name}">${name}</option>`).join('')}
                    </select>
                </div>
                <div id="progress-chart-container" class="progress-chart-container">
                    <p>Select an exercise to view your progress chart.</p>
                </div>
            </div>
        `;

        this.chartContainer = container.querySelector('#progress-chart-container');
        this.addEventListeners();
    }

    addEventListeners() {
        document.getElementById('exercise-select')?.addEventListener('change', (e) => {
            this.renderChartForExercise(e.target.value);
        });
    }

    renderChartForExercise(exerciseName) {
        if (!exerciseName) {
            this.chartContainer.innerHTML = '<p>Select an exercise to view your progress chart.</p>';
            return;
        }

        const user = this.app.authManager.getCurrentUser();
        const workoutLogs = this.app.dataStore.getWorkoutLogsForUser(user.id) || [];

        const chartData = workoutLogs.map(log => {
            const exercise = log.exercises?.find(ex => ex.name === exerciseName);
            if (!exercise || !exercise.sets || exercise.sets.length === 0) return null;
            const maxWeight = Math.max(...exercise.sets.map(set => set.weight || 0));
            return { date: new Date(log.date), value: maxWeight };
        }).filter(Boolean).sort((a, b) => a.date - b.date);

        if (chartData.length < 2) {
            this.chartContainer.innerHTML = '<p>Not enough data to draw a chart. You need at least two logs for this exercise.</p>';
            return;
        }

        this.drawCustomSvgChart(chartData);
    }

    drawCustomSvgChart(data) {
        this.chartContainer.innerHTML = '';
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        const padding = 50;
        const width = this.chartContainer.clientWidth || 600;
        const height = 300;
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

        const dates = data.map(d => d.date);
        const values = data.map(d => d.value);
        const minDate = dates[0].getTime();
        const maxDate = dates[dates.length - 1].getTime();
        const dateRange = maxDate - minDate || 1;
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const valueRange = maxValue - minValue || 1;

        const xScale = (date) => padding + ((date.getTime() - minDate) / dateRange) * (width - 2 * padding);
        const yScale = (value) => height - padding - ((value - minValue) / valueRange) * (height - 2 * padding);

        const pathData = data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.date)} ${yScale(p.value)}`).join(' ');
        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('class', 'chart-line');
        svg.appendChild(path);

        this.chartContainer.appendChild(svg);
    }
}

export default ProgressView;