import { debounce } from '../../../core/utils.js';
import { generateReport } from './modules/reportGenerator.js';
import { downloadPdf, downloadCsv, downloadTxt } from './modules/reportDownloads.js';
import { METRIC_EXPLANATIONS } from './modules/reportUtils.js';

class ReportsView {
    constructor(app) {
        this.app = app;
        this.rrData = { a: null, b: null };
        this.currentReportData = null;
        this.filterSettings = {
            windowSize: 5, // Default for HRV artifact filter
            threshold: 0.2
        };
        this.chartInstances = {};

        this.generateReport = (type) => generateReport(this, type);
        this.downloadPdf = () => downloadPdf(this.currentReportData, this.chartInstances, this.reportPages);
        this.downloadCsv = () => downloadCsv(this.currentReportData);
        this.downloadTxt = () => downloadTxt(this.currentReportData);
    }

    render(container) {
        container.innerHTML = `
            <div class="view-header">
                <h1>Reports</h1>
            </div>
            <p class="view-subheader">Load datasets and generate detailed reports on members and finances.</p>
            <div class="settings-grid">
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
                    <h3>Report Filters</h3>
                    <div class="form-group">
                        <label for="report-member-status">Member Status</label>
                        <select id="report-member-status" class="form-control">
                            <option value="all">All</option>
                            <option value="Active" selected>Active</option>
                            <option value="Paused">Paused</option>
                            <option value="Expired">Expired</option>
                        </select>
                        <label for="report-date-start">Date Range</label>
                        <input type="date" id="report-date-start" class="form-control">
                        <input type="date" id="report-date-end" class="form-control">
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
        document.getElementById('report-type-select').addEventListener('change', () => {
            this.updateGenerateButtonState();
        });
        document.getElementById('generate-report-btn').addEventListener('click', (e) => {
            const button = e.currentTarget;
            const reportType = document.getElementById('report-type-select').value;
            const outputContainer = document.getElementById('report-output');

            // Gather filter values
            const reportFilters = {
                memberStatus: document.getElementById('report-member-status').value,
                dateStart: document.getElementById('report-date-start').value,
                dateEnd: document.getElementById('report-date-end').value,
            };

            button.disabled = true;
            button.textContent = 'Generating...';
            outputContainer.innerHTML = `<div class="loading-spinner-container"><div class="loading-spinner"></div></div>`;

            setTimeout(() => { // Allow UI to update before starting heavy work
                try {
                    generateReport(this, reportType, reportFilters);

                    const existingActions = outputContainer.querySelector('.report-actions');
                    if (existingActions) existingActions.remove();

                    const downloadActionsHtml = `
                        <div class="report-actions widget">
                            <h3>Download Report</h3>
                            <div class="button-group">
                                <button id="download-pdf-btn" class="btn">Download PDF</button>
                                <button id="download-csv-btn" class="btn">Download CSV</button>
                                ${this.currentReportData.cleanedIntervals ? '<button id="download-txt-btn" class="btn">Download Cleaned RR (TXT)</button>' : ''}
                            </div>
                        </div>
                    `;
                    outputContainer.insertAdjacentHTML('afterbegin', downloadActionsHtml);
                    document.getElementById('download-pdf-btn').addEventListener('click', this.downloadPdf);
                    document.getElementById('download-csv-btn').addEventListener('click', this.downloadCsv);
                    if (this.currentReportData.cleanedIntervals) { document.getElementById('download-txt-btn').addEventListener('click', this.downloadTxt); }
                } catch (error) {
                    console.error('Report generation failed:', error);
                    outputContainer.innerHTML = `<p class="note text-danger">An error occurred while generating the report.</p>`;
                    this.app.uiManager.showNotification('Report generation failed.', 'error');
                } finally {
                    button.disabled = false;
                    button.textContent = 'Generate';
                }
            }, 50);
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
                this.filterSettings.windowSize = 5;
                this.filterSettings.threshold = 0.2;

                windowInput.value = 5;
                thresholdInput.value = 20;

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
        addOption('financialStatement', 'Financial Statement (P&L)');
        addOption('dashboardSummary', 'Dashboard Summary Report');
        
        const hrvContexts = ['Free', 'Training', 'Rest'];
        hrvContexts.forEach(context => {
            const type = context.toLowerCase();
            const reportName = `${context} HRV ANALYSIS`;
            const comparisonName = `Compare ${context} HRV`;

            if (this.rrData.a) addOption(`${type}HrvAnalysisA`, `${reportName} (A)`);
            if (this.rrData.b) addOption(`${type}HrvAnalysisB`, `${reportName} (B)`);
            if (this.rrData.a && this.rrData.b) addOption(`${type}HrvComparison`, `${comparisonName} (A vs B)`);
        });
        
        select.value = currentVal;
        this.updateGenerateButtonState();
    }

    updateGenerateButtonState() {
        const select = document.getElementById('report-type-select');
        document.getElementById('generate-report-btn').disabled = !select.value;
    }

    async handleRrUpload(slot) {
        const files = await this.app.fileService.openFilePicker({ accept: '.txt' });
        if (!files || files.length === 0) return;
        const file = files[0];

        try {
            const content = await this.app.fileService.readFileAsText(file);
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
            this.generateReport(currentReportType);
        }
    }
}

export default ReportsView;