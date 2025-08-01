/**
 * @module PdfService
 * @description A service for generating and printing PDF documents, like invoices.
 * Requires the jsPDF library to be loaded.
 */
class PdfService {
    constructor(localizationService, dataStore) {
        // Check if jsPDF is loaded
        if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') {
            console.error("PdfService requires jsPDF. Please include it in your project.");
        }
        this.t = localizationService.t.bind(localizationService);
        this.dataStore = dataStore;
    }

    /**
     * Generates a PDF for a given invoice.
     * @param {object} invoice - The invoice object.
     */
    async generateInvoicePdf(invoice) {
        if (!invoice) {
            console.error("generateInvoicePdf: No invoice data provided.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const template = await this.dataStore.getInvoiceTemplate();

        const t = this.t;

        // --- Document Header ---
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(template.primaryColor || '#000000');
        doc.text(t('invoice.title', 'INVOICE').toUpperCase(), 105, 20, { align: "center" });

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.setTextColor('#000000');
        doc.text(template.companyName, 20, 30);
        doc.text(template.companyAddress1, 20, 36);
        doc.text(template.companyAddress2, 20, 42);

        // --- Invoice Details ---
        doc.setFontSize(14);
        doc.text(`${t('invoice.invoiceNumber', 'Invoice #')}: ${invoice.id}`, 180, 40, { align: "right" });
        doc.text(`${t('invoice.date', 'Date')}: ${new Date(invoice.dueDate).toLocaleDateString('nl-NL')}`, 180, 46, { align: "right" });

        // --- Bill To ---
        doc.setFont("helvetica", "bold");
        doc.text(t('invoice.billTo', 'Bill To:'), 20, 60);
        doc.setFont("helvetica", "normal");
        doc.text(invoice.memberName, 20, 66);

        // --- Table Header ---
        doc.setDrawColor(0);
        doc.setFillColor(template.primaryColor || '#cccccc');
        doc.rect(20, 80, 170, 10, 'F'); // Header background
        doc.setFont("helvetica", "bold");
        doc.text(t('invoice.description', 'Description'), 25, 87);
        doc.text(t('invoice.amount', 'Amount'), 185, 87, { align: "right" });

        // --- Table Body ---
        doc.setFont("helvetica", "normal");
        doc.text(t('invoice.subscriptionFee', 'Subscription Fee'), 25, 97);
        doc.text(`€${invoice.amount.toFixed(2)}`, 185, 97, { align: "right" });

        // --- Total ---
        doc.setFont("helvetica", "bold");
        doc.line(20, 110, 190, 110); // horizontal line
        doc.text(t('invoice.total', 'Total'), 150, 117);
        doc.text(`€${invoice.amount.toFixed(2)}`, 185, 117, { align: "right" });

        // --- Footer ---
        doc.setFontSize(10);
        doc.text(template.footerText, 105, 140, { align: "center" });

        doc.save(`invoice-${invoice.id}-${invoice.memberName.replace(/\s/g, '_')}.pdf`);
    }

    /**
     * Generates a printable HTML view of an invoice and opens the print dialog.
     * @param {object} invoice - The invoice object.
     */
    async printInvoice(invoice) {
        if (!invoice) {
            console.error("printInvoice: No invoice data provided.");
            return;
        }

        const t = this.t;
        const template = await this.dataStore.getInvoiceTemplate();
        const printableHtml = `
            <html>
            <head>
                <title>${t('invoice.printTitle', 'Print Invoice #{0}', invoice.id)}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); font-size: 16px; line-height: 24px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
                    table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; }
                    table td { padding: 5px; vertical-align: top; }
                    table tr.heading td { background: ${template.primaryColor}; color: white; border-bottom: 1px solid #ddd; font-weight: bold; }
                    table tr.item td { border-bottom: 1px solid #eee; }
                    table tr.total td:last-child { border-top: 2px solid #eee; font-weight: bold; }
                    .text-right { text-align: right; }
                </style>
            </head>
            <body>
                <div class="invoice-box">
                    <div class="header">
                        <h2 style="color: ${template.primaryColor};">${t('invoice.title', 'INVOICE').toUpperCase()}</h2>
                    </div>
                    <div class="details">
                        <div>
                            <strong>${template.companyName}</strong><br>
                            ${template.companyAddress1}<br>
                            ${template.companyAddress2}
                        </div>
                        <div>
                            ${t('invoice.invoiceNumber', 'Invoice #')}: ${invoice.id}<br>
                            ${t('invoice.date', 'Date')}: ${new Date(invoice.dueDate).toLocaleDateString('nl-NL')}<br>
                            ${t('common.status', 'Status')}: ${invoice.status}
                        </div>
                    </div>
                    <div>
                        <strong>${t('invoice.billTo', 'Bill To:')}</strong><br>
                        ${invoice.memberName}
                    </div>
                    <br>
                    <table>
                        <tr class="heading">
                            <td>${t('invoice.description', 'Description')}</td>
                            <td class="text-right">${t('invoice.amount', 'Amount')}</td>
                        </tr>
                        <tr class="item">
                            <td>${t('invoice.subscriptionFee', 'Subscription Fee')}</td>
                            <td class="text-right">€${invoice.amount.toFixed(2)}</td>
                        </tr>
                        <tr class="total">
                            <td></td>
                            <td class="text-right">${t('invoice.total', 'Total')}: €${invoice.amount.toFixed(2)}</td>
                        </tr>
                    </table>
                    <div style="text-align: center; margin-top: 40px; font-size: 12px; color: #777;">
                        ${template.footerText}
                    </div>
                </div>
            </body>
            </html>
        `;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(printableHtml);
        doc.close();

        iframe.contentWindow.focus();
        iframe.contentWindow.print();

        // Clean up the iframe after printing
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);
    }
}

export default PdfService;