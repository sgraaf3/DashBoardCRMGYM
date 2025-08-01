/**
 * @class SvgChart
 * @description A static utility class to render simple SVG line charts.
 */
export class SvgChart {
    /**
     * Renders a simple SVG line chart.
     * @param {HTMLElement} container - The element to render the chart in.
     * @param {Array<object>} data - The data points. e.g., [{date: Date, weight: number}]
     * @param {string} dataKey - The key for the Y-axis value in the data objects.
     */
    static render(container, data, dataKey) {
        if (!container) return;
        if (!data || data.length < 2) {
            container.innerHTML = `<p>${LocalizationService.t('chart.notEnoughData')}</p>`;
            return;
        }

        // Basic chart dimensions and padding
        const width = container.clientWidth;
        const height = 250;
        const padding = { top: 20, right: 20, bottom: 40, left: 50 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Find data range
        const yValues = data.map(d => d[dataKey]);
        const xValues = data.map(d => d.date);
        const yMin = Math.min(...yValues);
        const yMax = Math.max(...yValues);
        const xMin = xValues[0];
        const xMax = xValues[xValues.length - 1];

        // Create scales
        const yScale = (val) => chartHeight - ((val - yMin) / (yMax - yMin || 1)) * chartHeight;
        const xScale = (date) => ((date.getTime() - xMin.getTime()) / (xMax.getTime() - xMin.getTime() || 1)) * chartWidth;

        // Generate SVG path data
        const pathData = data.map((d, i) => {
            const x = xScale(d.date);
            const y = yScale(d[dataKey]);
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)},${y.toFixed(2)}`;
        }).join(' ');

        // Generate axis labels
        const yAxisLabels = this.generateYAxisLabels(yMin, yMax);
        const xAxisLabels = this.generateXAxisLabels(xMin, xMax, 5);

        // Render SVG
        container.innerHTML = `
            <svg width="${width}" height="${height}" class="progress-chart">
                <g transform="translate(${padding.left}, ${padding.top})">
                    <!-- Y-axis labels and grid lines -->
                    ${yAxisLabels.map(label => `
                        <g class="y-axis-group" transform="translate(0, ${yScale(label.value)})">
                            <text x="-10" y="5" class="axis-label">${label.text}</text>
                            <line x1="0" y1="0" x2="${chartWidth}" y2="0" class="grid-line"></line>
                        </g>
                    `).join('')}

                    <!-- X-axis labels -->
                    ${xAxisLabels.map(label => `
                        <g class="x-axis-group" transform="translate(${xScale(label.value)}, ${chartHeight})">
                            <text x="0" y="20" class="axis-label">${label.text}</text>
                        </g>
                    `).join('')}

                    <!-- Data line -->
                    <path d="${pathData}" class="chart-line" fill="none" />

                    <!-- Data points -->
                    ${data.map(d => `<circle cx="${xScale(d.date)}" cy="${yScale(d[dataKey])}" r="4" class="chart-point"></circle>`).join('')}
                </g>
            </svg>
        `;
    }

    static generateYAxisLabels(min, max, count = 5) {
        if (max === min) return [{ value: min, text: min }];
        const labels = [];
        const range = max - min;
        const step = range > 0 ? range / (count - 1) : 0;
        for (let i = 0; i < count; i++) {
            const value = min + (i * step);
            labels.push({ value, text: Math.round(value) });
        }
        return labels;
    }

    static generateXAxisLabels(minDate, maxDate, count = 5) {
        const labels = [];
        const timeRange = maxDate.getTime() - minDate.getTime();
        if (timeRange === 0) return [{ value: minDate, text: minDate.toLocaleDateString() }];
        const step = timeRange / (count - 1);
        for (let i = 0; i < count; i++) {
            const date = new Date(minDate.getTime() + (i * step));
            labels.push({ value: date, text: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) });
        }
        return labels;
    }
}