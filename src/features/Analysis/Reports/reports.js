

let currentReportData = { title: '', headers: [], rows: [] };
const { jsPDF } = window.jspdf;

/**
 * Initializes all functionality for the Reports widget.
 */
export function initReports() {
    const generateReportBtn = document.getElementById('generate-report-btn');
    const reportModal = document.getElementById('report-modal');

    const downloadFile = (filename, content, mimeType) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([content], { type: mimeType }));
        a.download = filename;
        a.click();
    };

    generateReportBtn.addEventListener('click', async () => {
        const reportType = document.getElementById('report-type').value;
        switch (reportType) {
            case 'memberList':
                const membersData = await apiService.getMembers();
                currentReportData.title = 'Full Member List';
                currentReportData.headers = ["Name", "Email", "Join Date", "Status"];
                currentReportData.rows = membersData.map(m => [m.name, m.email, m.joinDate || 'N/A', m.status]);
                break;
            case 'memberGrowth':
                currentReportData.title = 'Member Growth Report';
                currentReportData.headers = ["Month", "New Members"];
                const growthChart = getMemberGrowthChart();
                currentReportData.rows = growthChart.data.labels.map((label, i) => [label, growthChart.data.datasets[0].data[i]]);
                break;
            case 'classPopularity':
                currentReportData.title = 'Class Popularity Report';
                currentReportData.headers = ["Class", "Attendance"];
                const popularityChart = getClassPopularityChart();
                currentReportData.rows = popularityChart.data.labels.map((label, i) => [label, popularityChart.data.datasets[0].data[i]]);
                break;
        }

        let reportHtml = `<table class="data-table"><thead><tr>${currentReportData.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${currentReportData.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
        document.getElementById('report-modal-title').textContent = currentReportData.title;
        document.getElementById('report-body').innerHTML = reportHtml;
        reportModal.classList.add('active');
    });

    document.getElementById('report-print-btn').addEventListener('click', () => window.print());
    document.getElementById('report-pdf-btn').addEventListener('click', () => {
        const doc = new jsPDF();
        doc.text(currentReportData.title, 14, 15);
        doc.autoTable({ head: [currentReportData.headers], body: currentReportData.rows, startY: 20 });
        doc.save(`${currentReportData.title.replace(/ /g, '_')}.pdf`);
    });
    document.getElementById('report-csv-btn').addEventListener('click', () => {
        let csv = currentReportData.headers.join(',') + '\r\n' + currentReportData.rows.map(r => r.join(',')).join('\r\n');
        downloadFile(`${currentReportData.title.replace(/ /g, '_')}.csv`, csv, 'text/csv');
    });
    document.getElementById('report-txt-btn').addEventListener('click', () => {
        let txt = `${currentReportData.title}\r\n\r\n` + currentReportData.headers.join('\t') + '\r\n' + currentReportData.rows.map(r => r.join('\t')).join('\r\n');
        downloadFile(`${currentReportData.title.replace(/ /g, '_')}.txt`, txt, 'text/plain');
    });
}
