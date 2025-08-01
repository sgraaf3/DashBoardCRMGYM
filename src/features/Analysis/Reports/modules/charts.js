import { readFileAsText, parseAndAnalyzeRrData, debounce } from '../../../../core/utils.js';
import { buildHrvReportPages } from './modules/hrvReportBuilder.js';

const GRAPH_EXPLANATIONS = {
    wellness: `
        <p>This graph provides a high-level overview of your physiological state over the course of the measurement. It combines several key metrics into two intuitive scores:</p>
        <ul>
            <li><strong>Recovery Score (0-100):</strong> This score reflects the dominance of your 'rest-and-digest' (parasympathetic) nervous system. It is primarily calculated from your RMSSD and resting heart rate. A higher score indicates a better state of recovery, suggesting your body is ready for strain.</li>
            <li><strong>Strain Score (0-100):</strong> This score reflects the level of stress or load on your system. It is calculated from your heart rate and its variability. A higher score indicates more physiological strain, which is expected during exercise but should be low during rest.</li>
        </ul>
        <p>By tracking these scores over time, you can better understand your body's response to training, sleep, and daily stressors, allowing you to optimize your performance and well-being.</p>
    `,
    tachogram: `
        <p>The Tachogram is the most fundamental view of your heart's activity, plotting each individual beat-to-beat interval (RR interval) over time. It is the raw data from which all other HRV metrics are derived.</p>
        <ul>
            <li><strong>What to look for:</strong> A healthy, well-regulated nervous system produces a 'spiky' and highly variable line, indicating that your heart rate is constantly making micro-adjustments. A flatter line suggests less adaptability and potential fatigue or stress.</li>
            <li><strong>Artifacts:</strong> This graph is also the best place to visually identify artifacts (sudden, non-physiological spikes or dips). The faint grey line shows the original raw data, while the bold colored line shows the data after our automated filter has corrected these artifacts. You can also click on any point to manually remove it.</li>
        </ul>
    `,
    psd: `
        <p>The Power Spectral Density (PSD) plot is an advanced analysis that breaks down your heart rate variability into its underlying frequency components, revealing the influence of different parts of your nervous system.</p>
        <ul>
            <li><strong>HF (High Frequency, 0.15-0.4Hz):</strong> This band, often called the 'respiratory band', is a pure indicator of your 'rest-and-digest' (parasympathetic) nervous system activity. Higher HF power is generally a sign of good recovery.</li>
            <li><strong>LF (Low Frequency, 0.04-0.15Hz):</strong> This band reflects the activity of both the parasympathetic and sympathetic ('fight-or-flight') systems. It is often associated with blood pressure regulation.</li>
            <li><strong>VLF (Very Low Frequency, 0.003-0.04Hz):</strong> This band is less understood but is thought to be related to very slow-acting regulatory systems like hormones and thermoregulation.</li>
        </ul>
    `,
    poincare: `
        <p>The Poincaré Plot is a non-linear analysis method that visualizes the correlation between one heartbeat and the next. It provides a unique, qualitative view of your autonomic nervous system's dynamics.</p>
        <ul>
            <li><strong>Shape:</strong> A healthy, adaptable system typically produces a comet-shaped or elongated ellipse. The 'cloud' of points should be well-distributed. A very tight, circular, or narrow shape can indicate high stress, fatigue, or an overly regular heart rhythm.</li>
            <li><strong>Metrics:</strong> The plot is quantified by <strong>SD1</strong> (the width of the cloud), which reflects short-term, parasympathetic variability, and <strong>SD2</strong> (the length of the cloud), which reflects longer-term, overall variability.</li>
        </ul>
    `,
    histogram: `
        <p>The RR Interval Histogram is a simple but powerful tool that shows the frequency distribution of all your recorded heartbeats. It tells you which heart rate intervals occurred most often during the measurement.</p>
        <ul>
            <li><strong>What to look for:</strong> A wider, more spread-out histogram is a hallmark of high overall HRV, which is generally desirable. It means your heart rate was not 'stuck' in one place. A very tall, narrow peak indicates that most of your heartbeats were very similar in length, which can be a sign of physiological or psychological stress.</li>
        </ul>
    `,
    respiration: `
        <p>This graph shows your estimated breathing pattern, derived from the rhythmic fluctuations in your heart rate known as Respiratory Sinus Arrhythmia (RSA). This is a direct, non-invasive way to observe the connection between your breathing and your nervous system.</p>
        <ul>
            <li><strong>How it works:</strong> When you inhale, your heart rate naturally speeds up. When you exhale, it slows down. The HF band of the PSD plot captures this rhythm. This graph visualizes that rhythm over time.</li>
            <li><strong>Uses:</strong> It's useful for seeing how your breathing rate changes during different states (e.g., rest vs. exercise) and for practicing controlled breathing exercises to actively increase your HRV.</li>
        </ul>
    `
};

const METRIC_EXPLANATIONS = {
    artifactCount: "The number of irregular heartbeats (artifacts) detected and corrected by the filter. A high percentage may indicate a noisy recording.",
    meanRR: "The average time between heartbeats. A higher value generally indicates a lower resting heart rate.",
    sdnn: "Standard Deviation of NN intervals. A measure of overall heart rate variability. Higher values are generally better.",
    rmssd: "Root Mean Square of Successive Differences. A key indicator of parasympathetic (rest-and-digest) nervous system activity. Higher values are generally better.",
    pNN50: "The percentage of adjacent heartbeats that differ by more than 50ms. Another strong indicator of parasympathetic activity.",
    sd1: "The standard deviation of the short-term variability in the Poincaré plot. Reflects parasympathetic activity.",
    sd2: "The standard deviation of the long-term variability in the Poincaré plot. Reflects both sympathetic and parasympathetic activity.",
    sdann: "A measure of long-term variability, calculated over 5-minute intervals.",
    sampen: "Sample Entropy. A measure of the complexity and regularity of the heartbeat pattern. Higher values indicate more complexity and adaptability.",
    vlf: "Very Low Frequency power. Reflects very slow-acting regulatory mechanisms, often associated with hormonal and thermoregulatory systems.",
    lf: "Low Frequency power. Reflects a mix of sympathetic (fight-or-flight) and parasympathetic activity. Often associated with blood pressure regulation.",
    hf: "High Frequency power. Primarily reflects parasympathetic (rest-and-digest) activity, linked to breathing (RSA).",
    lfhfRatio: "The ratio of LF to HF power. Often used as a simple index of sympathovagal balance, though interpretation requires context.",
    recoveryScore: "A composite score (0-100) reflecting your 'rest-and-digest' system's dominance. Higher scores indicate better recovery and readiness for strain.",
    strainScore: "A composite score (0-100) reflecting the current physiological load on your system. Higher scores indicate more stress or exertion."
};

class ReportsView {
    constructor(app) {
        this.app = app;
        this.rrData = { a: null, b: null }; // a: { name, intervals }, b: { name, intervals }
        this.currentReportData = null;
        this.filterSettings = {
            windowSize: 5,
            threshold: 0.2
        };
        this.chartInstances = {};
    }

    render(container) {
        container.innerHTML = `
            <div class="view-header"><h1>Reports</h1></div>
            <div class="reports-main-grid">
                <div class="widget">
                    <h3>1. Load Data</h3>
                    <div class="rr-comparison-loader">
                        <div class="rr-loader-slot" id="rr-loader-a">
                            <h4>Dataset A</h4>
                            <p id="file-name-a" class="file-name-display">No file loaded.</p>
                            <button class="btn upload-rr-btn" data-slot="a">Upload Dataset A</button>
                        </div>
                        <div class="rr-loader-slot" id="rr-loader-b">
                            <h4>Dataset B</h4>
                            <p id="file-name-b" class="file-name-display">No file loaded.</p>
                            <button class="btn upload-rr-btn" data-slot="b">Upload Dataset B</button>
                        </div>
                    </div>
                </div>
                <div class="widget">
                    <h3>2. Analysis Settings</h3>
                    <div id="hrv-settings-container" class="form-group">
                        <label for="filter-window-size">Filter Window Size (odd, e.g., 5, 7)</label>
                        <input type="number" id="filter-window-size" class="form-control" value="5" step="2" min="3">
                        <label for="filter-threshold">Filter Threshold (%)</label>
                        <input type="number" id="filter-threshold" class="form-control" value="20" min="1" max="100">
                        <p class="note">Settings are debounced and applied automatically.</p>
                        <button id="reset-filter-btn" class="btn btn-sm" style="margin-top: 0.5rem;">Reset to Default</button>
                    </div>
                </div>
                <div class="widget">
                    <h3>3. Generate Report</h3>
                    <div class="report-controls">
                        <select id="report-type-select" class="form-control"></select>
                        <button id="generate-report-btn" class="btn btn-primary" disabled>Generate</button>
                    </div>
                    <p class="note">Select a report type from the list.</p>
                </div>
            </div>
            <div id="report-output" class="report-output-container"></div>
        `;
        this.addEventListeners();
        this.updateReportOptions();
    }

    addEventListeners() {
        document.getElementById('report-type-select').addEventListener('change', (e) => {
            this.updateGenerateButtonState();
        });
        document.getElementById('generate-report-btn').addEventListener('click', () => {
            const reportType = document.getElementById('report-type-select').value;
            this.generateReport(reportType);
        });
        document.querySelectorAll('.upload-rr-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const slot = e.target.dataset.slot;
                this.handleRrUpload(slot);
            });
        });

        const windowInput = document.getElementById('filter-window-size');
        const thresholdInput = document.getElementById('filter-threshold');

        const reanalyze = debounce(() => {
            const currentReportType = document.getElementById('report-type-select').value;
            if (currentReportType.startsWith('rrAnalysis') || currentReportType === 'rrComparison') {
                this.filterSettings.windowSize = parseInt(windowInput.value, 10) || 5;
                this.filterSettings.threshold = (parseInt(thresholdInput.value, 10) || 20) / 100;
                
                if (this.filterSettings.windowSize % 2 === 0) {
                    this.filterSettings.windowSize++;
                    windowInput.value = this.filterSettings.windowSize;
                }
                this.app.uiManager.showNotification('Settings updated. Re-analyzing...', 'info');
                this.generateReport(currentReportType);
            }
        });
        windowInput.addEventListener('input', reanalyze);
        thresholdInput.addEventListener('input', reanalyze);

        const resetFilterBtn = document.getElementById('reset-filter-btn');
        if (resetFilterBtn) {
            resetFilterBtn.addEventListener('click', () => {
                // Reset state
                this.filterSettings.windowSize = 5;
                this.filterSettings.threshold = 0.2;

                // Update UI
                windowInput.value = 5;
                thresholdInput.value = 20;

                // Trigger re-analysis with default settings
                reanalyze();
            });
        }
    }

    updateReportOptions() {
        const select = document.getElementById('report-type-select');
        const currentVal = select.value;
        select.innerHTML = '';

        const addOption = (value, text) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = text;
            select.appendChild(option);
        };

        addOption('', '-- Select a Report --');
        addOption('memberList', 'Member List');
        addOption('memberGrowth', 'Member Growth');
        addOption('classPopularity', 'Class Popularity');
        addOption('dashboardSummary', 'Dashboard Summary Report');
        
        const hrvContexts = ['Free', 'Training', 'Rest']; // Define the different contexts for HRV analysis
        hrvContexts.forEach(context => {
            const type = context.toLowerCase();
            const reportName = `${context} HRV ANALYSIS`;
            const comparisonName = `Compare ${context} HRV`;

            if (this.rrData.a) addOption(`${type}HrvAnalysisA`, `${reportName} (A)`);
            if (this.rrData.b) addOption(`${type}HrvAnalysisB`, `${reportName} (B)`);
            if (this.rrData.a && this.rrData.b) addOption(`${type}HrvComparison`, `${comparisonName} (A vs B)`);
        });
        
        select.value = currentVal; // try to restore previous selection
        this.updateGenerateButtonState();
    }

    updateGenerateButtonState() {
        const select = document.getElementById('report-type-select');
        document.getElementById('generate-report-btn').disabled = !select.value;
    }

    handleRrUpload(slot) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt';
        input.onchange = async e => {
           const file = e.target.files[0];
           if (!file) return;
           try {
                const content = await readFileAsText(file);
                const intervals = content.split('\n').map(line => parseInt(line.trim(), 10)).filter(n => !isNaN(n) && n > 0);
                if (intervals.length < 10) {
                    this.app.uiManager.showNotification('File contains too few valid RR intervals for analysis.', 'error');
                    return;
                }
                this.rrData[slot] = { name: file.name, intervals: intervals };
                document.getElementById(`file-name-${slot}`).textContent = file.name;
                this.app.uiManager.showNotification(`Dataset ${slot.toUpperCase()} loaded: ${file.name}`, 'success');
                this.updateReportOptions();
           } catch (error) {
               console.error('Error reading file:', error);
               this.app.uiManager.showNotification(`Error reading file: ${error.message}`, 'error');
           }
        };
        input.click();
    }

    async requestDataPointDeletion(slot, index) {
        const intervalValue = this.rrData[slot].intervals[index];
        const currentReportType = document.getElementById('report-type-select').value;

        const confirmed = await this.app.uiManager.showConfirmation(
            'Delete Data Point?',
            `Are you sure you want to permanently remove the data point at index ${index} with value ${intervalValue}ms? This action cannot be undone.`
        );

        if (confirmed) {
            this.rrData[slot].intervals.splice(index, 1);
            this.app.uiManager.showNotification('Data point removed. Re-analyzing...', 'info');
            // Re-run the currently selected report
            this.generateReport(currentReportType);
        }
    }

    _createMetricLabelHtml(label, key) {
        const explanation = METRIC_EXPLANATIONS[key];
        if (explanation) {
            // Simple info icon with a tooltip
            return `${label} <span class="info-icon" title="${explanation}">&#9432;</span>`;
        }
        return label;
    }

    generateReport(type) {
        const outputContainer = document.getElementById('report-output');
        outputContainer.innerHTML = ''; 
        Object.values(this.chartInstances).forEach(chart => chart.destroy()); 
        this.chartInstances = {};

        const isHrvReport = type.includes('HrvAnalysis');
        const isComparison = type.includes('Comparison');
        const hrvContext = type.match(/^(free|training|rest)/i)?.[0] || 'Free';

        let title, headers, rows, reportPages = [], chartConfigs = [];

        switch (type) {
            case 'memberList':
                const members = this.app.dataStore.getMembers();
                title = 'Full Member List';
                headers = ["ID", "Name", "Email", "Status", "Join Date"];
                rows = members.map(m => [m.id, m.name, m.email, m.status, new Date(m.joinDate).toLocaleDateString()]);
                break;
            case 'memberGrowth':
                const growthData = this.app.dataStore.getMembers().reduce((acc, member) => {
                    const month = new Date(member.joinDate).toISOString().slice(0, 7);
                    acc[month] = (acc[month] || 0) + 1;
                    return acc;
                }, {});
                const sortedMonths = Object.keys(growthData).sort();
                title = 'Member Growth by Month';
                headers = ["Month", "New Members"];
                const growthValues = sortedMonths.map(month => growthData[month]);
                rows = sortedMonths.map((month, i) => [month, growthValues[i]]);
                const growthScale = this._getPaddedScale(growthValues);
                chartConfigs.push({ id: 'report-chart', type: 'line', data: { labels: sortedMonths, datasets: [{ label: 'New Members', data: growthValues, tension: 0.1 }] }, options: { scales: { y: growthScale } } });
                break;
            case 'classPopularity':
                const workoutLogs = this.app.dataStore.getWorkoutLogs();
                const schemas = this.app.dataStore.getWorkoutSchemas();
                const popularity = workoutLogs.reduce((acc, log) => {
                    acc[log.schemaId] = (acc[log.schemaId] || 0) + 1;
                    return acc;
                }, {});
                
                title = 'Class Popularity';
                headers = ["Schema Name", "Times Logged"];
                rows = Object.entries(popularity)
                    .map(([schemaId, count]) => {
                        const schema = schemas.find(s => s.id == schemaId);
                        return { name: schema ? schema.name : `Unknown Schema (ID: ${schemaId})`, count };
                    }).sort((a, b) => b.count - a.count) // Sort descending
                    .map(item => [item.name, item.count]);
                
                chartConfigs.push({ id: 'report-chart', type: 'pie', data: { labels: rows.map(r => r[0]), datasets: [{ label: 'Popularity', data: rows.map(r => r[1]) }] } });
                break;
            case 'dashboardSummary':
                title = 'Comprehensive Dashboard Report';

                // --- Data Gathering (mirrors dashboardView) ---
                const allMembers = this.app.dataStore.getMembers();
                const allWorkoutLogs = this.app.dataStore.getWorkoutLogs();
                const allSchemas = this.app.dataStore.getWorkoutSchemas();
                const financialSummary = this.app.dataStore.getFinancialSummary();
                const activeMembers = this.app.dataStore.getActiveMembersCount();
                const sessionsToday = this.app.dataStore.getSessionsTodayCount();
                const gymOccupancy = this.app.dataStore.getGymOccupancy();
                const avgTrainerRating = this.app.dataStore.getAverageTrainerRating();

                // --- Table Data (KPIs) ---
                headers = ["Key Performance Indicator", "Value"];
                rows = [
                    ["Active Members", activeMembers],
                    ["Available Training Plans", allSchemas.length],
                    ["Sessions Today", sessionsToday],
                    ["Gym Occupancy", gymOccupancy],
                    ["Average Trainer Rating", `${avgTrainerRating} / 5`],
                    ["Total Revenue", `€ ${financialSummary.totalRevenue.toLocaleString('nl-NL')}`],
                    ["Total Expenses", `€ ${financialSummary.totalExpenses.toLocaleString('nl-NL')}`],
                    ["Net Profit", `€ ${financialSummary.netProfit.toLocaleString('nl-NL')}`],
                ];

                // --- Chart Configurations ---
                // Member Growth Chart
                const memberGrowthData = allMembers.reduce((acc, member) => {
                    const month = new Date(member.joinDate).toISOString().slice(0, 7);
                    acc[month] = (acc[month] || 0) + 1;
                    return acc;
                }, {});
                const growthMonths = Object.keys(memberGrowthData).sort();
                chartConfigs.push({
                    id: 'member-growth-chart', title: 'Member Growth', type: 'line',
                    data: { labels: growthMonths, datasets: [{ label: 'New Members', data: growthMonths.map(month => memberGrowthData[month]), borderColor: '#60a5fa', backgroundColor: 'rgba(96, 165, 250, 0.2)', tension: 0.1, fill: true }] }
                });

                // Class Popularity Chart
                const popularityData = allWorkoutLogs.reduce((acc, log) => {
                    const schema = allSchemas.find(s => s.id === log.schemaId);
                    const name = schema ? schema.name : 'Custom Workout';
                    acc[name] = (acc[name] || 0) + 1;
                    return acc;
                }, {});
                const sortedPopularity = Object.entries(popularityData).sort(([, a], [, b]) => b - a);
                const chartColors = ['#60a5fa', '#f87171', '#4ade80', '#facc15', '#a78bfa', '#fb923c', '#34d399', '#fb7185'];
                chartConfigs.push({
                    id: 'class-popularity-chart', title: 'Class Popularity', type: 'doughnut',
                    data: { labels: sortedPopularity.map(([name]) => name), datasets: [{ label: 'Times Logged', data: sortedPopularity.map(([, count]) => count), backgroundColor: chartColors }] }
                });

                // Financial Overview Chart
                const financialData = [financialSummary.totalRevenue, financialSummary.totalExpenses, financialSummary.netProfit];
                const financialScale = this._getPaddedScale(financialData);
                chartConfigs.push({
                    id: 'financial-chart', title: 'Financial Overview', type: 'bar',
                    data: {
                        labels: ['Revenue', 'Expenses', 'Net Profit'],
                        datasets: [{
                            label: 'Finances (€)',
                            data: financialData,
                            backgroundColor: ['#4ade80', '#f87171', '#60a5fa']
                        }]
                    },
                    options: { scales: { y: financialScale } }
                });
                break;
        }

        if (isHrvReport && !isComparison) {
                const slot = type.slice(-1).toLowerCase();
                const data = this.rrData[slot];
                if (!data) { this.app.uiManager.showNotification(`Dataset ${slot.toUpperCase()} not loaded.`, 'error'); return; }
                
                const analysis = parseAndAnalyzeRrData(data.intervals, this.filterSettings);
                if (analysis.count === 0) { this.app.uiManager.showNotification('Could not find valid RR interval data in the file.', 'error'); return; }

                title = `${hrvContext.charAt(0).toUpperCase() + hrvContext.slice(1)} HRV ANALYSIS (${slot.toUpperCase()})`;
                headers = ["Metric", "Value"];
                rows = [
                    [this._createMetricLabelHtml("Artifacts Corrected", "artifactCount"), `${analysis.artifactCount} (${((analysis.artifactCount / analysis.count) * 100).toFixed(1)}%)`],
                    ...this._getMetricsAsRows(analysis)
                ];
                
                reportPages = buildHrvReportPages(analysis, slot, (s, i) => this.requestDataPointDeletion(s, i));
        } else if (isHrvReport && isComparison) {
                if (!this.rrData.a || !this.rrData.b) { this.app.uiManager.showNotification('Please load both datasets to compare.', 'error'); return; }
                
                const analysisA = parseAndAnalyzeRrData(this.rrData.a.intervals, this.filterSettings);
                const analysisB = parseAndAnalyzeRrData(this.rrData.b.intervals, this.filterSettings);

                title = `Comparison of ${hrvContext.charAt(0).toUpperCase() + hrvContext.slice(1)} HRV`;
                headers = ["Metric", `A: ${this.rrData.a.name}`, `B: ${this.rrData.b.name}`, "Difference (B-A)"];
                
                const createRow = (metric, key) => {
                    const valA = parseFloat(analysisA[key]);
                    const valB = parseFloat(analysisB[key]);
                    const diff = (valB - valA).toFixed(2);
                    return [metric, valA, valB, diff];
                };

                rows = [
                    [this._createMetricLabelHtml("Artifacts Corrected", "artifactCount"), analysisA.artifactCount, analysisB.artifactCount, analysisB.artifactCount - analysisA.artifactCount],
                    ...this._getMetricsAsComparisonRows(analysisA, analysisB)
                ];

                // Comparison reports don't use the page-based layout for now, they just show the table.
                // This could be expanded in the future to show side-by-side page comparisons.
        }

        // For single HRV analysis, add cleaned intervals for export
        const cleanedIntervals = (isHrvReport && !isComparison) ? parseAndAnalyzeRrData(this.rrData[type.slice(-1).toLowerCase()].intervals, this.filterSettings).intervals : null;

        this.currentReportData = { title, headers, rows, cleanedIntervals };
        this.renderReportOutput(outputContainer, title, headers, rows, reportPages, isHrvReport, isComparison);
    }

    renderReportOutput(container, title, headers, rows, reportPages = [], isHrvReport = false, isComparison = false) {
        const tableHtml = `
            <table class="report-table">
                <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>`;
        
        const downloadTxtBtnHtml = this.currentReportData.cleanedIntervals ? `<button id="download-txt-btn" class="btn">Download Cleaned RR (.txt)</button>` : '';

        const interpretationBtnHtml = isHrvReport ? `<button id="toggle-interpretation-btn" class="btn">Show Interpretation Guide</button>` : '';

        const chartsHtml = reportPages.length > 0 ? `
            <div class="report-graphs-container">
                ${reportPages.map(page => {
                    if (page.isSummary) {
                        return `
                            <div class="report-graph-page summary-page">
                                <div class="report-graph-header"><h3>${page.title}</h3></div>
                                <div class="summary-content">
                                    <h4>Overall Findings</h4>
                                    <p>${page.summary}</p>
                                    <h4>Recommendations to Improve</h4>
                                    <ul>${page.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>
                                </div>
                            </div>
                        `;
                    }
                    return `
                        <div class="report-graph-page">
                            <div class="report-graph-header"><h3>${page.title}</h3></div>
                            <div class="report-graph-content">
                                <div class="outcome-section">
                                    <div class="outcome-score score-${page.outcome.score > 60 ? 'good' : (page.outcome.score < 40 ? 'bad' : 'ok')}">${page.outcome.score}</div>
                                    <div class="outcome-text">
                                        <strong>${page.outcome.label}</strong>
                                        <p>${page.outcome.interpretation}</p>
                                    </div>
                                </div>
                                <div class="goods-bads-table">${this._renderGoodsBadsTable(page.goodsBads)}</div>
                                <div class="report-graph-explanation">${page.explanation}</div>
                                <div class="chart-wrapper"><canvas id="${page.chartConfig.id}"></canvas></div>
                            </div>
                        </div>`;
                }).join('')}
            </div>
        ` : '';

        container.innerHTML = `
            <div class="widget">
                <div class="report-header">
                    <h3>${title}</h3>
                    <div class="report-actions">
                        <button id="download-pdf-btn" class="btn">Download PDF</button>
                        <button id="download-csv-btn" class="btn">Download CSV</button>
                        ${downloadTxtBtnHtml}
                        ${interpretationBtnHtml}
                    </div>
                </div>
                <div class="report-table-container">${(isHrvReport && !isComparison) ? '' : tableHtml}</div>
                ${chartsHtml}
                ${isHrvReport ? `<div class="report-table-container" style="margin-top: 2rem;"><h3>Detailed Metrics</h3>${tableHtml}</div>` : ''}
                ${this._getInterpretationGuideHtml(isHrvReport)}
            </div>
        `;

        // Render charts. By this point, Chart.js is guaranteed to be loaded.
        if (typeof Chart !== 'undefined') {
            reportPages.forEach(page => {
                if (page.chartConfig) {
                    const canvas = document.getElementById(page.chartConfig.id);
                    if (canvas) {
                        this.chartInstances[page.chartConfig.id] = new Chart(canvas.getContext('2d'), page.chartConfig);
                    }
                }
            });
        } else {
            console.error('Chart.js is not available, cannot render report charts.');
            reportPages.forEach(page => {
                if (page.chartConfig) {
                    const canvas = document.getElementById(page.chartConfig.id);
                    if (canvas && canvas.parentElement) canvas.parentElement.innerHTML = '<p class="note text-danger">Error: Chart library unavailable.</p>';
                }
            });
        }

        document.getElementById('download-pdf-btn').addEventListener('click', () => this.downloadPdf());
        document.getElementById('download-csv-btn').addEventListener('click', () => this.downloadCsv());
        document.getElementById('download-txt-btn')?.addEventListener('click', () => this.downloadTxt());
        document.getElementById('toggle-interpretation-btn')?.addEventListener('click', (e) => {
            const interpretationDiv = document.getElementById('report-interpretation');
            const isHidden = interpretationDiv.classList.toggle('hidden');
            e.target.textContent = isHidden ? 'Show Interpretation Guide' : 'Hide Interpretation Guide';
        });
    }

    _renderGoodsBadsTable(items) {
        if (!items || items.length === 0) return '';
        return `
            <table>
                <thead><tr><th>Finding</th><th>Reason</th></tr></thead>
                <tbody>
                    ${items.map(item => `<tr class="finding-${item.type}"><td>${item.point}</td><td>${item.reason}</td></tr>`).join('')}
                </tbody>
            </table>
        `;
    }

    _getInterpretationGuideHtml(isHrvReport) {
        if (!isHrvReport) return '';
        return `
            <div id="report-interpretation" class="widget hidden" style="margin-top: 1.5rem;">
                <div class="widget-header">
                    <h3>Interpretation Guide</h3>
                </div>
                <h4>The Founder's Method</h4>
                <p class="interpretation-text">The C.U.T.E. HRV Analysis method was born from a personal journey of burnout and recovery. Our founder, a former competitive athlete, realized that traditional training metrics only told half the story. Pushing through fatigue led to overtraining and injury. It was only by diving deep into the science of Heart Rate Variability that a true understanding of the body's readiness and recovery state was found. This tool is the culmination of years of research and self-experimentation, designed not just to track performance, but to foster a conversation with your nervous system. Our philosophy is simple: listen to your body, train smarter, and build sustainable health from the inside out. This report is your guide in that conversation.</p>
                
                <h4>Interpreting Key Metrics</h4>
                 <ul class="interpretation-list">
                    <li><strong>Recovery Score:</strong> A high score (e.g., > 65) suggests your 'rest-and-digest' system is active and you are well-recovered. A low score (e.g., < 40) may indicate fatigue, stress, or illness.</li>
                    <li><strong>Strain Score:</strong> This score reflects physiological load. During a resting measurement, this should be low (e.g., < 30). During intense exercise, it will be high. A high resting strain score is a red flag for accumulated stress.</li>
                    <li><strong>RMSSD:</strong> A key indicator of parasympathetic activity. For healthy adults, resting values typically range from 20-100ms. <strong>Higher is generally better,</strong> indicating good recovery.</li>
                    <li><strong>SDNN:</strong> Reflects overall HRV. Resting values are typically 40-150ms. <strong>Higher is generally better,</strong> showing adaptability.</li>
                    <li><strong>pNN50:</strong> Similar to RMSSD. Resting values often range from 5-40%. <strong>Higher is generally better.</strong></li>
                    <li><strong>LF/HF Ratio:</strong> A simple index of 'sympathovagal balance'. A resting ratio is often between 1.0 and 2.0. A significantly higher ratio might suggest a stress response. <strong>Context is key.</strong></li>
                    <li><strong>Sample Entropy (SampEn):</strong> Measures the complexity of your heart rhythm. Healthy systems are complex and adaptable. <strong>Higher values (e.g., > 1.5) are generally better.</strong></li>
                </ul>
                <p class="note"><strong>Important:</strong> HRV values are highly individual. The most valuable insights come from tracking your own trends over time relative to your training, sleep, and lifestyle, rather than comparing your numbers to others.</p>
            </div>
        `;
    }

    downloadPdf() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pageMargin = 15;
        const contentWidth = doc.internal.pageSize.getWidth() - (2 * pageMargin);
        let currentY = 20;
        const chartConfigs = reportPages.filter(p => p.chartConfig).map(p => this.chartInstances[p.chartConfig.id]).filter(Boolean);

        // 1. Add Report Title
        doc.setFontSize(18);
        doc.text(this.currentReportData.title, pageMargin, currentY);
        currentY += 10;

        // 2. Add Charts
        const pagesToRender = reportPages.length > 0 ? reportPages : chartConfigs.map(c => ({ chartConfig: c, title: c.options.plugins.title.text }));

        pagesToRender.filter(p => p.chartConfig).forEach(page => {
            const chart = this.chartInstances[page.chartConfig.id];
            if (!chart) return;

            const canvas = chart.canvas;
            const imageData = canvas.toDataURL('image/png');
            const canvasAspectRatio = canvas.width / canvas.height;
            const imgWidth = contentWidth;
            const imgHeight = imgWidth / canvasAspectRatio;

            // Check if there is enough space for the image on the current page
            if (currentY + imgHeight > doc.internal.pageSize.getHeight() - pageMargin) {
                doc.addPage();
                currentY = pageMargin; // Reset Y for new page
            }

            // Add chart title if it exists
            if (page.title) {
                doc.setFontSize(12);
                doc.text(page.title, pageMargin, currentY);
                currentY += 7;
            }

            doc.addImage(imageData, 'PNG', pageMargin, currentY, imgWidth, imgHeight);
            currentY += imgHeight + 10;
        });

        // 3. Add Data Table
        // Check if we need a new page for the table
        if (currentY > doc.internal.pageSize.getHeight() - 40) { // 40 is a rough estimate for table height
            doc.addPage();
            currentY = pageMargin;
        }

        // 3. Add Data Table
        const tableHeaders = this.currentReportData.headers.map(h => h.replace(/ <span.*<\/span>/, '')); // Strip HTML from headers for PDF
        doc.autoTable({ head: [tableHeaders], body: this.currentReportData.rows.map(row => [row[0].replace(/ <span.*<\/span>/, ''), ...row.slice(1)]), startY: currentY });
        currentY = doc.autoTable.previous.finalY + 10;

        // 4. Add Interpretation Guide if it's an HRV report
        const interpretationDiv = document.getElementById('report-interpretation');
        if (interpretationDiv) {
            doc.addPage();
            currentY = pageMargin;
            doc.setFontSize(16);
            doc.text("Interpretation Guide", pageMargin, currentY);
            currentY += 10;

            const interpretationElements = interpretationDiv.querySelectorAll('h4, p, li, strong');
            interpretationElements.forEach(el => {
                if (currentY > doc.internal.pageSize.getHeight() - pageMargin) {
                    doc.addPage();
                    currentY = pageMargin;
                }
                doc.setFontSize(el.tagName === 'H4' ? 12 : 10);
                doc.setFont(undefined, el.tagName === 'H4' ? 'bold' : 'normal');
                const text = el.textContent;
                const splitText = doc.splitTextToSize(text, contentWidth);
                const xOffset = (el.tagName === 'LI' ? 5 : 0);

                doc.text(splitText, pageMargin + xOffset, currentY);
                const textHeight = doc.getTextDimensions(splitText).h;
                currentY += textHeight + (el.tagName === 'H4' ? 3 : 2);
            });
        }

        doc.save(`${this.currentReportData.title.replace(/\s/g, '_')}.pdf`);
    }

    _downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    downloadCsv() {
        const csvContent = this.currentReportData.headers.join(",") + "\n" + this.currentReportData.rows.map(e => e.join(",")).join("\n");
        this._downloadFile(`${this.currentReportData.title.replace(/\s/g, '_')}.csv`, csvContent, 'text/csv;charset=utf-8,');
    }

    downloadTxt() {
        if (!this.currentReportData?.cleanedIntervals) return;
        const txtContent = this.currentReportData.cleanedIntervals.join('\n');
        const filename = `${this.currentReportData.title.replace(/\s/g, '_')}_cleaned.txt`;
        this._downloadFile(filename, txtContent, 'text/plain');
    }

    _getPaddedScale(data) {
        if (!data || data.length === 0) {
            return { min: 0, max: 10 }; // Default scale
        }
        const numericData = data.flat().filter(d => typeof d === 'number' && !isNaN(d));
        if (numericData.length === 0) {
            return { min: 0, max: 10 };
        }
    
        let maxVal = Math.max(...numericData);
        let minVal = Math.min(...numericData);
    
        if (maxVal === minVal) {
            const absVal = Math.abs(minVal);
            const padding = absVal > 1 ? absVal * 0.1 : 1;
            return { min: minVal - padding, max: maxVal + padding };
        }
    
        const range = maxVal - minVal;
        const padding = range * 0.10;
    
        return { min: minVal - padding, max: maxVal + padding };
    }

    _getMetricsAsRows(analysis) {
        return [
            [this._createMetricLabelHtml("Recovery Score", "recoveryScore"), analysis.recoveryScore],
            [this._createMetricLabelHtml("Strain Score", "strainScore"), analysis.strainScore],
            [this._createMetricLabelHtml("Mean RR (ms)", "meanRR"), analysis.meanRR],
            [this._createMetricLabelHtml("RMSSD (ms)", "rmssd"), analysis.rmssd],
            [this._createMetricLabelHtml("SDNN (ms)", "sdnn"), analysis.sdnn],
            [this._createMetricLabelHtml("pNN50 (%)", "pNN50"), analysis.pNN50],
            [this._createMetricLabelHtml("SD1 (ms)", "sd1"), analysis.sd1],
            [this._createMetricLabelHtml("SD2 (ms)", "sd2"), analysis.sd2],
            [this._createMetricLabelHtml("SDANN (ms)", "sdann"), analysis.sdann],
            [this._createMetricLabelHtml("Sample Entropy", "sampen"), analysis.sampen],
            [this._createMetricLabelHtml("VLF Power (ms^2)", "vlf"), analysis.vlf],
            [this._createMetricLabelHtml("LF Power (ms^2)", "lf"), analysis.lf],
            [this._createMetricLabelHtml("HF Power (ms^2)", "hf"), analysis.hf],
            [this._createMetricLabelHtml("LF/HF Ratio", "lfhfRatio"), analysis.lfhfRatio]
        ];
    }

    _getMetricsAsComparisonRows(analysisA, analysisB) {
        const createRow = (metricKey, label) => {
            const valA = parseFloat(analysisA[metricKey]);
            const valB = parseFloat(analysisB[metricKey]);
            const diff = (valB - valA).toFixed(2);
            return [this._createMetricLabelHtml(label, metricKey), valA, valB, diff];
        };
        return [
            createRow("recoveryScore", "Recovery Score"),
            createRow("strainScore", "Strain Score"),
            createRow("meanRR", "Mean RR (ms)"),
            createRow("rmssd", "RMSSD (ms)"),
            createRow("sdnn", "SDNN (ms)"),
            createRow("pNN50", "pNN50 (%)"),
            createRow("sd1", "SD1 (ms)"),
            createRow("sd2", "SD2 (ms)"),
            createRow("sdann", "SDANN (ms)"),
            createRow("sampen", "Sample Entropy"),
            createRow("vlf", "VLF Power (ms^2)"),
            createRow("lf", "LF Power (ms^2)"),
            createRow("hf", "HF Power (ms^2)"),
            createRow("lfhfRatio", "LF/HF Ratio"),
        ];
    }
}

export default ReportsView;