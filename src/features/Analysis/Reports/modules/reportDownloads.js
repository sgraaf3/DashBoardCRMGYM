export function downloadPdf(reportData, chartInstances, reportPages) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageMargin = 15;
    const contentWidth = doc.internal.pageSize.getWidth() - (2 * pageMargin);
    let currentY = 20;
    const chartConfigs = reportPages.filter(p => p.chartConfig).map(p => chartInstances[p.chartConfig.id]).filter(Boolean);

    doc.setFontSize(18);
    doc.text(reportData.title, pageMargin, currentY);
    currentY += 10;

    if (reportData.headers && reportData.rows && reportData.rows.length > 0) {
        if (doc.autoTable) {
            doc.autoTable({
                head: [reportData.headers],
                body: reportData.rows,
                startY: currentY,
            });
            currentY = doc.autoTable.previous.finalY + 10;
        } else {
            // Fallback manual table rendering if autoTable plugin is not available
            doc.setFontSize(10);
            const rowHeight = 7;
            const cellPadding = 2;

            // Draw headers
            doc.setFont('helvetica', 'bold');
            let x = pageMargin;
            reportData.headers.forEach(header => {
                doc.text(header, x + cellPadding, currentY + 5);
                x += (contentWidth / reportData.headers.length);
            });
            currentY += rowHeight;
            doc.line(pageMargin, currentY, pageMargin + contentWidth, currentY);
            currentY += 2;

            // Draw rows
            doc.setFont('helvetica', 'normal');
            reportData.rows.forEach(row => {
                if (currentY + rowHeight > doc.internal.pageSize.getHeight() - pageMargin) { doc.addPage(); currentY = pageMargin; }
                x = pageMargin;
                row.forEach(cell => { doc.text(String(cell), x + cellPadding, currentY + 5); x += (contentWidth / reportData.headers.length); });
                currentY += rowHeight;
            });
            currentY += 10;
        }
    }

    const pagesToRender = reportPages.length > 0 ? reportPages : chartConfigs.map(c => ({ chartConfig: c, title: c.options.plugins.title.text }));

    pagesToRender.filter(p => p.chartConfig).forEach(page => {
        const chart = chartInstances[page.chartConfig.id];
        if (!chart) return;

        const canvas = chart.canvas;
        const imageData = canvas.toDataURL('image/png');
        const canvasAspectRatio = canvas.width / canvas.height;
        const imgWidth = contentWidth;
        const imgHeight = imgWidth / canvasAspectRatio;

        if (currentY + imgHeight > doc.internal.pageSize.getHeight() - pageMargin) {
            doc.addPage();
            currentY = pageMargin;
        }

        doc.text(page.title, pageMargin, currentY);
        currentY += 5;
        doc.addImage(imageData, 'PNG', pageMargin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 10;
    });

    doc.save(`${reportData.title.replace(/\s/g, '_')}.pdf`);
}

export function downloadCsv(reportData) {
    const csvContent = reportData.headers.join(",") + "\n" + reportData.rows.map(e => e.join(",")).join("\n");
    _downloadFile(`${reportData.title.replace(/\s/g, '_')}.csv`, csvContent, 'text/csv;charset=utf-8,');
}

export function downloadTxt(reportData) {
    if (!reportData.cleanedIntervals) return;
    const txtContent = reportData.cleanedIntervals.join('\n');
    const filename = `${reportData.title.replace(/\s/g, '_')}_cleaned.txt`;
    _downloadFile(filename, txtContent, 'text/plain');
}

function _downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}