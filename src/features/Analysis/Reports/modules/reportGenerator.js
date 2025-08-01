/**
 * @module reportGenerator
 * @description Generates the content for various reports based on type and filters.
 */

import { buildHrvReportPages } from './hrvReportBuilder.js';

export function generateReport(viewContext, reportType, filters) {
    const dataStore = viewContext.app.dataStore;
    const outputContainer = document.getElementById('report-output');
    let reportHtml = '';
    let reportData = {};

    // --- Apply Filters ---
    let members = dataStore.getMembers();
    if (filters.memberStatus && filters.memberStatus !== 'all') {
        members = members.filter(m => m.status === filters.memberStatus);
    }
    if (filters.dateStart) {
        members = members.filter(m => m.joinDate >= filters.dateStart);
    }
    if (filters.dateEnd) {
        // Further filter other data types like logs, invoices etc.
    }

    switch (reportType) {
        case 'memberList':
            reportData = {
                title: 'Member List Report',
                data: members.map(m => ({ Name: m.name, Email: m.email, Status: m.status, 'Join Date': m.joinDate }))
            };
            reportHtml = createTableHtml(reportData.data, `Member List (${filters.memberStatus})`);
            break;

        case 'memberGrowth':
            // This report type uses its own internal calculation, filters could be applied here
            const growthData = viewContext._calculateMemberGrowth(members);
            reportData = { title: 'Member Growth Report', data: growthData };
            reportHtml = `<p>Member Growth chart will be generated in the PDF download.</p>`;
            break;

        // Add cases for other report types, applying filters as needed...

        default:
            // Handle HRV and other reports that might not use these filters
            if (reportType.includes('HrvAnalysis')) {
                const slot = reportType.endsWith('A') ? 'a' : 'b';
                const analysisResult = viewContext.app.utils.parseAndAnalyzeRrData(viewContext.rrData[slot].intervals, viewContext.filterSettings);
                viewContext.reportPages = buildHrvReportPages(analysisResult, `Dataset ${slot.toUpperCase()}`);
                reportHtml = viewContext.reportPages.map(p => `<div class="widget"><h3>${p.title}</h3><div id="${p.chartConfig.id}"></div></div>`).join('');
                reportData = analysisResult;
            } else {
                reportHtml = `<p class="note">Report type "${reportType}" is not yet implemented or does not support these filters.</p>`;
            }
            break;
    }

    outputContainer.innerHTML = reportHtml;
    viewContext.currentReportData = reportData; // Store for download

    // Re-render charts if any were created
    if (viewContext.reportPages) {
        viewContext.reportPages.forEach(page => viewContext.renderSingleChart(page.chartConfig));
    }
}

function createTableHtml(data, title) {
    if (!data || data.length === 0) return `<div class="widget"><h3>${title}</h3><p class="note">No data available for this report.</p></div>`;
    const headers = Object.keys(data[0]);
    return `<div class="widget"><h3>${title}</h3><table class="activity-table">
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${data.map(row => `<tr>${headers.map(h => `<td>${row[h]}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>`;
}