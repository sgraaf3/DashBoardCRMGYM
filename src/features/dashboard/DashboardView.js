// DashboardView.js

/**
 * Manages the rendering and interaction of the Dashboard view.
 */
export class DashboardView {
    constructor(app) {
        this.app = app;
        this.chart = null; // To hold the chart instance
        this.currentMetric = 'volume'; // Default metric
    }

    render(container, model = null) {
        const userData = this.app.dbManager.get('user_data');
        // Aangepast om de configuratie uit SchedulemakerDB te halen
        const dbConfig = this.app.dbManager.get('SchedulemakerDB');

        if (!userData || !userData.users || userData.users.length === 0 || !dbConfig) {
            container.innerHTML = '<p>Dashboard data could not be loaded.</p>';
            return;
        }

        const user = userData.users[0];
        const lastWorkout = user.workout_logs.length > 0 ? [...user.workout_logs].pop() : null;

        let lastWorkoutHtml = '<p>No workouts logged yet. Time to hit the gym!</p>';
        if (lastWorkout) {
            const appConfig = this.app.dbManager.get('application_config');
            const exerciseDetails = lastWorkout.exercises.map(ex => {
                const configEx = appConfig.exercises.find(e => e.id === ex.exercise_id);
                const name = configEx ? configEx.name : 'Unknown Exercise';
                const sets = ex.sets.length;
                return `<li>${name} - ${sets} sets</li>`;
            }).join('');

            lastWorkoutHtml = `
                <h4>${lastWorkout.workout_name} - <small>${new Date(lastWorkout.date).toLocaleDateString()}</small></h4>
                <ul class="compact-list">${exerciseDetails}</ul>
            `;
        }

        container.innerHTML = `
            <div class="view-header">
                <h1>Welcome, ${user.username}!</h1>
                <p>Dashboard: Your personal fitness summary</p>
            </div>
            <div class="dashboard-grid">
                <div class="widget">
                    <h3>Last Workout</h3>
                    ${lastWorkoutHtml}
                </div>
                <div class="widget">
                    <div class="widget-header">
                        <h3>Weekly Trend</h3>
                        <div class="chart-controls">
                            <select id="chart-metric-select" class="form-control-small">
                                <option value="volume" ${this.currentMetric === 'volume' ? 'selected' : ''}>Total Volume</option>
                                <option value="reps" ${this.currentMetric === 'reps' ? 'selected' : ''}>Total Reps</option>
                                <option value="maxWeight" ${this.currentMetric === 'maxWeight' ? 'selected' : ''}>Max Weight</option>
                            </select>
                        </div>
                    </div>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="volume-chart"></canvas>
                    </div>
                </div>
            </div>
        `;

        this.addEventListeners(container);
        this.renderChart(user.workout_logs, dbConfig.chart_configurations.charts);
    }

    addEventListeners(container) {
        const metricSelect = container.querySelector('#chart-metric-select');
        if (metricSelect) {
            metricSelect.addEventListener('change', (e) => {
                this.currentMetric = e.target.value;
                const userData = this.app.dbManager.get('user_data');
                const dbConfig = this.app.dbManager.get('SchedulemakerDB');
                this.renderChart(userData.users[0].workout_logs, dbConfig.chart_configurations.charts);
            });
        }
    }

    renderChart(logs, chartConfigs) {
        const canvas = document.getElementById('volume-chart');
        if (!canvas || !logs || logs.length === 0) return;

        if (this.chart) this.chart.destroy();

        const recentLogs = logs.slice(-7);
        const labels = recentLogs.map(log => new Date(log.date).toLocaleDateString('en-CA'));
        
        let data, label;
        let chartId;

        switch (this.currentMetric) {
            case 'reps':
                label = 'Total Reps';
                data = recentLogs.map(log => 
                    log.exercises.reduce((totalReps, ex) => 
                        totalReps + ex.sets.reduce((reps, set) => reps + set.reps, 0), 0)
                );
                chartId = 'sdnnChart'; // Gebruik een bestaande chart id uit de configuratie
                break;
            case 'maxWeight':
                label = 'Max Weight Lifted (kg)';
                data = recentLogs.map(log => 
                    Math.max(0, ...log.exercises.flatMap(ex => ex.sets.map(set => set.weight)))
                );
                chartId = 'rmssdChart'; // Gebruik een bestaande chart id uit de configuratie
                break;
            case 'volume':
            default:
                label = 'Total Volume (kg)';
                data = recentLogs.map(log => 
                    log.exercises.reduce((totalVolume, ex) => 
                        totalVolume + ex.sets.reduce((vol, set) => vol + (set.reps * set.weight), 0), 0)
                );
                chartId = 'hrChart'; // Gebruik een bestaande chart id uit de configuratie
                break;
        }

        // Zoek de juiste configuratie op basis van de gekozen metric
        const config = chartConfigs.find(c => c.id === chartId);
        const chartColor = config ? config.color : '#3498db';

        this.chart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{ 
                    label: label, 
                    data: data, 
                    borderColor: chartColor,
                    backgroundColor: `${chartColor}33`,
                    fill: true, 
                    tension: 0.1 
                }]
            },
            options: {
                maintainAspectRatio: false,
                responsive: true,
                scales: {
                    x: {
                        ticks: { display: true }
                    },
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: `Weekly Trend: ${label}`, font: { size: 14, style: 'italic' }, color: '#888' }
                },
                animation: { duration: 500 }
            }
        });
    }
}