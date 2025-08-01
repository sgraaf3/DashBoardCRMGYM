function getPaddedScale(data) {
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

export function createWellnessConfig(analysis, slot, onClickHandler) {
    const slotId = slot ? `-${slot}` : '';
    const slotTitle = slot ? ` (${slot.toUpperCase()})` : '';
    const wellnessScale = { min: 0, max: 100 }; // Wellness scores are 0-100
    const hrvScale = getPaddedScale([...analysis.rollingMetrics.rmssd, ...analysis.rollingMetrics.sdnn]);
    return {
        id: `dynamics-chart${slotId}`,
        title: `Wellness Scores & HRV Dynamics${slotTitle}`,
        chartKey: 'wellness',
        type: 'line',
        data: {
            labels: analysis.rollingMetrics.time,
            datasets: [
                { label: 'Recovery Score', data: analysis.rollingMetrics.recovery, borderColor: '#34d399', yAxisID: 'yWellness', pointRadius: 1, borderWidth: 2 },
                { label: 'Strain Score', data: analysis.rollingMetrics.strain, borderColor: '#f87171', yAxisID: 'yWellness', pointRadius: 1, borderWidth: 2 },
                { label: 'RMSSD (ms)', data: analysis.rollingMetrics.rmssd, borderColor: '#60a5fa', yAxisID: 'yHRV', pointRadius: 1, borderWidth: 1, borderDash: [5, 5], hidden: true },
            ]
        },
        options: {
            scales: {
                x: { title: { display: true, text: 'Time (s)' } },
                yWellness: { type: 'linear', position: 'left', title: { display: true, text: 'Wellness Score (0-100)' }, ...wellnessScale },
                yHRV: { type: 'linear', position: 'right', title: { display: true, text: 'HRV (ms)' }, grid: { drawOnChartArea: false }, ...hrvScale }
            }
        }
    };
}

export function createTachogramConfig(analysis, slot, onClickHandler) {
    const slotId = slot ? `-${slot}` : '';
    const slotTitle = slot ? ` (${slot.toUpperCase()})` : '';
    const allTachogramData = [...analysis.rawIntervals, ...analysis.intervals];
    const tachogramScale = getPaddedScale(allTachogramData);
    return {
        id: `tachogram-chart${slotId}`, title: `Tachogram${slotTitle}`, type: 'line',
        chartKey: 'tachogram',
        data: {
            labels: analysis.intervals.map((_, i) => i + 1),
            datasets: [
                { label: 'Raw RR Interval (ms)', data: analysis.rawIntervals, borderColor: 'rgba(200, 200, 200, 0.7)', pointRadius: 1, borderWidth: 1 },
                { label: 'Filtered RR Interval (ms)', data: analysis.intervals, borderColor: '#60a5fa', pointRadius: 1, borderWidth: 2 }
            ]
        },
        options: {
            scales: { y: tachogramScale },
            plugins: {
                annotation: {
                    annotations: analysis.events.map(event => ({
                        type: 'line', scaleID: 'x', value: event.index, borderColor: 'rgba(220, 53, 69, 0.7)', borderWidth: 2, borderDash: [6, 6],
                        label: { content: event.label, display: true, position: 'start', yAdjust: -10, font: { weight: 'bold' } }
                    }))
                }
            },
            onClick: (e) => {
                const points = e.chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
                if (points.length && onClickHandler) { onClickHandler(slot, points[0].index); }
            }
        }
    };
}

export function createPsdConfig(analysis, slot, onClickHandler) {
    const slotId = slot ? `-${slot}` : '';
    const slotTitle = slot ? ` (${slot.toUpperCase()})` : '';
    const psdValues = analysis.psdData.map(p => p.y);
    const psdMax = psdValues.length > 0 ? Math.max(...psdValues) : 10;
    const psdScale = { min: 0, max: psdMax + 100 };
    return {
        id: `psd-chart${slotId}`, title: `Power Spectral Density${slotTitle}`, type: 'line',
        chartKey: 'psd',
        data: {
            datasets: [{
                label: 'PSD (ms^2/Hz)', data: analysis.psdData, borderColor: '#f87171', fill: true,
                backgroundColor: 'rgba(248, 113, 113, 0.2)', pointRadius: 1, borderWidth: 1
            }]
        },
        options: {
            scales: {
                x: { type: 'linear', min: 0.015, title: { display: true, text: 'Frequency (Hz)' } },
                y: { ...psdScale, title: { display: true, text: 'Power (ms^2/Hz)' } }
            },
            onClick: () => onClickHandler(null) // Pass null to indicate no specific point
        }
    };
}

export function createPoincareConfig(analysis, slot, onClickHandler) {
    const slotId = slot ? `-${slot}` : '';
    const slotTitle = slot ? ` (${slot.toUpperCase()})` : '';
    const poincareAllValues = [...analysis.poincareData.map(p => p.x), ...analysis.poincareData.map(p => p.y)];
    const poincareScale = getPaddedScale(poincareAllValues);
    return {
        id: `poincare-chart${slotId}`, title: `Poincaré Plot${slotTitle}`, type: 'scatter',
        chartKey: 'poincare',
        data: {
            datasets: [{
                label: 'RR(i) vs RR(i+1)', data: analysis.poincareData, backgroundColor: 'rgba(96, 165, 250, 0.5)', pointRadius: 3
            }]
        },
        options: {
            aspectRatio: 1,
            scales: {
                x: { ...poincareScale, title: { display: true, text: 'RR(i) (ms)' } },
                y: { ...poincareScale, title: { display: true, text: 'RR(i+1) (ms)' } }
            },
            onClick: (e) => {
                const points = e.chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
                if (points.length && onClickHandler) { onClickHandler(slot, points[0].index); }
            }
        }
    };
}

export function createHistogramConfig(analysis, slot, onClickHandler) {
    const slotId = slot ? `-${slot}` : '';
    const slotTitle = slot ? ` (${slot.toUpperCase()})` : '';
    const histogramScale = getPaddedScale(analysis.histogramData.data);
    return {
        id: `histogram-chart${slotId}`, title: `RR Interval Histogram${slotTitle}`, type: 'bar',
        chartKey: 'histogram',
        data: {
            labels: analysis.histogramData.labels,
            datasets: [{
                label: 'Frequency', data: analysis.histogramData.data, backgroundColor: 'rgba(167, 139, 250, 0.6)',
                borderColor: 'rgba(167, 139, 250, 1)', borderWidth: 1
            }]
        },
        options: { scales: { x: { title: { display: true, text: 'RR Interval Bins (ms)' } }, y: { ...histogramScale, title: { display: true, text: 'Count' } } } }
    };
}

export function createRespirationConfig(analysis, slot, onClickHandler) {
    const slotId = slot ? `-${slot}` : '';
    const slotTitle = slot ? ` (${slot.toUpperCase()})` : '';
    const breathingScale = getPaddedScale(analysis.breathingSignal);
    return {
        id: `breathing-chart${slotId}`, title: `Derived Respiration${slotTitle}`, type: 'line',
        chartKey: 'respiration',
        data: {
            labels: analysis.breathingSignal.map((_, i) => (i / 4).toFixed(2)),
            datasets: [{
                label: 'Respiratory Sinus Arrhythmia', data: analysis.breathingSignal, borderColor: '#34d399',
                pointRadius: 0, borderWidth: 1.5
            }]
        },
        options: { scales: { x: { title: { display: true, text: 'Time (s)' } }, y: { ...breathingScale, title: { display: true, text: 'Amplitude (ms)' } } } }
    };
}