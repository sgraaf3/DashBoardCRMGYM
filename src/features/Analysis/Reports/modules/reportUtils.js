export const METRIC_EXPLANATIONS = {
    artifactCount: "The number of irregular heartbeats (artifacts) detected and corrected by the filter. A high percentage may indicate a noisy recording.",
    meanRR: "The average time between heartbeats. A higher value generally indicates a lower resting heart rate.",
    sdnn: "Standard Deviation of NN intervals. A measure of overall heart rate variability. Higher values are generally better.",
    rmssd: "Root Mean Square of Successive Differences. A key indicator of parasympathetic (rest-and-digest) nervous system activity. Higher values are generally better.",
    pNN50: "The percentage of adjacent heartbeats that differ by more than 50ms. Another strong indicator of parasympathetic activity.",
    sd1: "The standard deviation of the short-term variability in the Poincaré plot. Reflects parasympathetic activity.",
    sd2: "The standard deviation of the long-term variability in the Poincaré plot. Reflects both sympathetic and parasympathetic activity.",
    sdann: "A measure of long-term variability, calculated over 5-minute intervals.",
    dfa_alpha1: "Detrended Fluctuation Analysis (Alpha 1). Measures the correlation properties of the time series. Values around 1.0 suggest fractal-like correlations, while values closer to 0.5 suggest random noise, and values closer to 1.5 suggest strong trends.",
    sampen: "Sample Entropy. A measure of the complexity and regularity of the heartbeat pattern. Higher values indicate more complexity and adaptability.",
    vlf: "Very Low Frequency power. Reflects very slow-acting regulatory mechanisms, often associated with hormonal and thermoregulatory systems.",
    lf: "Low Frequency power. Reflects a mix of sympathetic (fight-or-flight) and parasympathetic activity. Often associated with blood pressure regulation.",
    hf: "High Frequency power. Primarily reflects parasympathetic (rest-and-digest) activity, linked to breathing (RSA).",
    lfhfRatio: "The ratio of LF to HF power. Often used as a simple index of sympathovagal balance, though interpretation requires context.",
    recoveryScore: "A composite score (0-100) reflecting your 'rest-and-digest' system's dominance. Higher scores indicate better recovery and readiness for strain.",
    strainScore: "A composite score (0-100) reflecting the current physiological load on your system. Higher scores indicate more stress or exertion."
};

export function createMetricLabelHtml(label, key) {
    const explanation = METRIC_EXPLANATIONS[key];
    if (explanation) {
        return `${label} <span class="info-icon" title="${explanation}">&#9432;</span>`;
    }
    return label;
}

export function getPaddedScale(data) {
    if (!data || data.length === 0) {
        return { min: 0, max: 10 };
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

export function getMetricsAsRows(analysis) {
    return [
        [createMetricLabelHtml("Recovery Score", "recoveryScore"), analysis.recoveryScore],
        [createMetricLabelHtml("Strain Score", "strainScore"), analysis.strainScore],
        [createMetricLabelHtml("Mean RR (ms)", "meanRR"), analysis.meanRR],
        [createMetricLabelHtml("RMSSD (ms)", "rmssd"), analysis.rmssd],
        [createMetricLabelHtml("SDNN (ms)", "sdnn"), analysis.sdnn],
        [createMetricLabelHtml("pNN50 (%)", "pNN50"), analysis.pNN50],
        [createMetricLabelHtml("SD1 (ms)", "sd1"), analysis.sd1],
        [createMetricLabelHtml("SD2 (ms)", "sd2"), analysis.sd2],
        [createMetricLabelHtml("SDANN (ms)", "sdann"), analysis.sdann],
        [createMetricLabelHtml("DFA Alpha 1", "dfa_alpha1"), analysis.dfa_alpha1],
        [createMetricLabelHtml("Sample Entropy", "sampen"), analysis.sampen],
        [createMetricLabelHtml("VLF Power (ms^2)", "vlf"), analysis.vlf],
        [createMetricLabelHtml("LF Power (ms^2)", "lf"), analysis.lf],
        [createMetricLabelHtml("HF Power (ms^2)", "hf"), analysis.hf],
        [createMetricLabelHtml("LF/HF Ratio", "lfhfRatio"), analysis.lfhfRatio]
    ];
}

export function getMetricsAsComparisonRows(analysisA, analysisB) {
    const createRow = (metricKey, label) => {
        const valA = parseFloat(analysisA[metricKey]);
        const valB = parseFloat(analysisB[metricKey]);
        const diff = (valB - valA).toFixed(2);
        return [createMetricLabelHtml(label, metricKey), valA, valB, diff];
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
        createRow("dfa_alpha1", "DFA Alpha 1"),
        createRow("sampen", "Sample Entropy"),
        createRow("vlf", "VLF Power (ms^2)"),
        createRow("lf", "LF Power (ms^2)"),
        createRow("hf", "HF Power (ms^2)"),
        createRow("lfhfRatio", "LF/HF Ratio"),
    ];
}