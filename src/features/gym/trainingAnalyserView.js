import { analyzeHrv } from '../../core/utils.js';
import { buildHrvReportPages } from '../Analysis/Reports/modules/hrvReportBuilder.js';

class TrainingAnalyserView {
    constructor(app) {
        this.app = app;
        this.chartInstances = {};
    }

    render(container) {
        const members = this.app.dataStore.getMembers();
        const memberOptions = members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

        container.innerHTML = `
            <div class="view-header">
                <h1>Training Analyser</h1>
                <p>Select a member to view their HRV analysis from logged sessions.</p>
            </div>
            <div class="widget">
                <h3>Select Member</h3>
                <select id="analyser-member-select" class="form-control">
                    <option value="">-- Select a Member --</option>
                    ${memberOptions}
                </select>
            </div>
            <div id="analyser-sessions-container"></div>
            <div id="analyser-report-container"></div>
        `;
        this.addEventListeners();
    }

    addEventListeners() {
        document.getElementById('analyser-member-select').addEventListener('change', e => {
            this.handleMemberSelect(e.target.value);
        });
    }

    handleMemberSelect(memberId) {
        const sessionsContainer = document.getElementById('analyser-sessions-container');
        const reportContainer = document.getElementById('analyser-report-container');
        sessionsContainer.innerHTML = '';
        reportContainer.innerHTML = '';
        Object.values(this.chartInstances).forEach(chart => chart.destroy());
        this.chartInstances = {};

        if (!memberId) return;

        const allLogs = this.app.dataStore.getWorkoutLogs();
        const memberLogsWithHrv = allLogs.filter(log => log.userId === memberId && log.rr_data);

        if (memberLogsWithHrv.length === 0) {
            sessionsContainer.innerHTML = `<div class="widget"><p>No sessions with HRV data found for this member.</p></div>`;
            return;
        }

        const sessionsHtml = memberLogsWithHrv.map(log => {
            const schema = this.app.dataStore.getWorkoutSchema(log.schemaId);
            return `
                <li class="clickable-list-item" data-log-id="${log.id}">
                    <strong>${schema ? schema.name : 'Custom Workout'}</strong>
                    <span>${new Date(log.date).toLocaleString('nl-NL')}</span>
                </li>
            `;
        }).join('');

        sessionsContainer.innerHTML = `
            <div class="widget">
                <h3>Select Session</h3>
                <ul class="widget-list">${sessionsHtml}</ul>
            </div>
        `;

        sessionsContainer.querySelector('ul').addEventListener('click', e => {
            const listItem = e.target.closest('li');
            if (listItem) {
                const logId = listItem.dataset.logId;
                this.renderAnalysis(logId);
            }
        });
    }

    renderAnalysis(logId) {
        const log = this.app.dataStore.getWorkoutLogs().find(l => l.id == logId);
        if (!log || !log.rr_data) {
            document.getElementById('analyser-report-container').innerHTML = `<p>Error: Could not find log or HRV data.</p>`;
            return;
        }

        const analysisResult = analyzeHrv(log.rr_data);
        const reportPages = buildHrvReportPages(analysisResult);

        const reportHtml = reportPages.map(page => `
            <div class="widget">
                <h3>${page.title}</h3>
                ${page.tableHtml || ''}
                ${page.chartConfig ? `<div class="chart-container" style="height: 400px;"><canvas id="${page.chartConfig.id}"></canvas></div>` : ''}
            </div>
        `).join('');

        document.getElementById('analyser-report-container').innerHTML = reportHtml;

        reportPages.forEach(page => {
            if (page.chartConfig) {
                const canvas = document.getElementById(page.chartConfig.id);
                if (canvas) {
                    this.chartInstances[page.chartConfig.id] = new Chart(canvas, page.chartConfig.config);
                }
            }
        });
    }
}

export default TrainingAnalyserView;