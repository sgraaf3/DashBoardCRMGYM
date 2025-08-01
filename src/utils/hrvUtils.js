/**
 * @module HrvUtils
 * @description A collection of functions for calculating and analyzing Heart Rate Variability.
 */

/**
 * Parses a string of RR interval data and calculates basic HRV metrics.
 * Assumes one RR interval (in ms) per line.
 * @param {number[]} rawIntervals - An array of raw RR intervals in milliseconds.
 * @param {object} [filterSettings={}] - Optional settings for the artifact filter.
 * @param {number} [filterSettings.windowSize=5] - The size of the moving window.
 * @param {number} [filterSettings.threshold=0.2] - The fractional deviation threshold.
 * @returns {object} An object with parsed intervals and calculated metrics, including PSD data for plotting.
 */
export function parseAndAnalyzeRrData(rawIntervals, filterSettings = {}) {
    if (rawIntervals.length < 32) { // Need enough data for DFA
        return { intervals: [], rawIntervals: [], artifactCount: 0, count: 0, meanRR: 0, sdnn: 0, rmssd: 0, pNN50: 0, lf: 0, hf: 0, vlf: 0, lfhfRatio: 0, sd1: 0, sd2: 0, sampen: 0, sdann: 0, poincareData: [], psdData: [], events: [], histogramData: { labels: [], data: [] }, breathingSignal: [], rollingMetrics: { time: [], hr: [], rmssd: [], sdnn: [], pnn50: [], recovery: [], strain: [] }, recoveryScore: 0, strainScore: 0 };
    }

    // --- Artifact Filtering ---
    const { filteredIntervals, correctedCount } = filterRrArtifacts(rawIntervals, filterSettings.windowSize, filterSettings.threshold);
    const intervals = filteredIntervals; // Use filtered intervals for all subsequent calculations

    const count = intervals.length;
    const sum = intervals.reduce((a, b) => a + b, 0);
    const meanRR = sum / count;

    const sdnn = Math.sqrt(
        intervals.map(x => Math.pow(x - meanRR, 2)).reduce((a, b) => a + b, 0) / count
    );

    const successiveDifferences = [];
    for (let i = 0; i < intervals.length - 1; i++) {
        successiveDifferences.push(Math.pow(intervals[i + 1] - intervals[i], 2));
    }
    const rmssd = Math.sqrt(successiveDifferences.reduce((a, b) => a + b, 0) / successiveDifferences.length);

    // Calculate pNN50
    let nn50Count = 0;
    for (let i = 0; i < intervals.length - 1; i++) {
        if (Math.abs(intervals[i + 1] - intervals[i]) > 50) {
            nn50Count++;
        }
    }
    const pNN50 = (nn50Count / (intervals.length - 1)) * 100;

    // --- Poincaré Plot & Metrics (SD1, SD2) ---
    const poincareData = [];
    for (let i = 0; i < intervals.length - 1; i++) {
        poincareData.push({ x: intervals[i], y: intervals[i + 1] });
    }
    const diffs = intervals.slice(1).map((val, i) => val - intervals[i]);
    const varDiff = diffs.map(v => Math.pow(v - (diffs.reduce((a, b) => a + b, 0) / diffs.length), 2)).reduce((a, b) => a + b, 0) / (diffs.length - 1);
    const sd1 = Math.sqrt(0.5 * varDiff);
    const sd2 = Math.sqrt(2 * Math.pow(sdnn, 2) - 0.5 * varDiff);

    // --- Complexity (Sample Entropy) ---
    const sampen = calculateSampleEntropy(intervals, 2, 0.2 * sdnn);

    // --- Long-term variability (SDANN) ---
    const sdann = calculateSdann(intervals);

    // --- DFA alpha 1 ---
    const dfa_alpha1 = calculateDfa(intervals);

    // --- Histogram ---
    const histogramData = createRrHistogram(intervals);

    // --- Rolling Metrics ---
    const rollingMetrics = calculateRollingHrvMetrics(intervals);

    // --- Frequency Domain Analysis (must be done before wellness scores that use its metrics) ---
    let freqMetrics = { vlf: 0, lf: 0, hf: 0, lfhfRatio: 0, psdData: [], breathingSignal: [] };
    // Check if there's enough data for a meaningful frequency analysis (e.g., > 60 seconds)
    if (sum > 60000) {
        freqMetrics = calculateFrequencyDomainMetrics(intervals);
    }

    // --- Wellness Scores (must be done after frequency analysis) ---
    // Normalize values to a 0-1 scale before calculating scores
    const rmssd_norm = normalizeValue(rmssd, 15, 80); // Good RMSSD is high
    const hr_norm_inv = normalizeValue(meanRR, 50, 90, true); // Good HR is low (inverted)
    const recoveryScore = Math.round(((rmssd_norm * 0.7) + (hr_norm_inv * 0.3)) * 100);

    const lfhf_norm = normalizeValue(freqMetrics.lfhfRatio, 0.5, 2.5); // High LF/HF can indicate strain
    const hr_norm = normalizeValue(meanRR, 50, 90); // High HR indicates strain
    const strainScore = Math.round(((lfhf_norm * 0.6) + (hr_norm * 0.4)) * 100);

    // Mock events for demonstration. In a real app, this would come from session data.
    const events = [];
    if (intervals.length > 100) {
        events.push({ index: 50, label: 'Start Set 1' });
        events.push({ index: 80, label: 'End Set 1' });
    }
    if (intervals.length > 200) {
        events.push({ index: 150, label: 'Start Set 2' });
        events.push({ index: 180, label: 'End Set 2' });
    }

    return {
        intervals,
        rawIntervals,
        artifactCount: correctedCount,
        count,
        meanRR: Math.round(meanRR),
        sdnn: Math.round(sdnn),
        rmssd: Math.round(rmssd),
        pNN50: parseFloat(pNN50.toFixed(2)),
        vlf: freqMetrics.vlf.toFixed(2),
        lf: freqMetrics.lf.toFixed(2),
        hf: freqMetrics.hf.toFixed(2),
        lfhfRatio: freqMetrics.lfhfRatio.toFixed(2),
        sd1: Math.round(sd1),
        sd2: Math.round(sd2),
        sampen: parseFloat(sampen.toFixed(3)),
        sdann: Math.round(sdann),
        dfa_alpha1: parseFloat(dfa_alpha1.toFixed(3)),
        poincareData,
        psdData: freqMetrics.psdData,
        events: events,
        histogramData,
        breathingSignal: freqMetrics.breathingSignal,
        rollingMetrics,
        recoveryScore,
        strainScore,
    };
}

/**
 * Calculates frequency domain metrics (LF, HF, LF/HF ratio) from RR intervals.
 * @param {number[]} rrIntervals - An array of RR intervals in milliseconds.
 * @returns {{vlf: number, lf: number, hf: number, lfhfRatio: number, psdData: object[], breathingSignal: number[]}}
 */
function calculateFrequencyDomainMetrics(rrIntervals) {
    const SAMPLING_RATE = 4; // Hz, a standard for HRV analysis

    // 1. Create time axis from RR intervals
    const timeAxis = [0];
    for (let i = 0; i < rrIntervals.length - 1; i++) {
        timeAxis.push(timeAxis[i] + rrIntervals[i] / 1000); // in seconds
    }

    // 2. Interpolate to get an evenly sampled signal
    const interpolated = cubicSplineInterpolation(timeAxis, rrIntervals, SAMPLING_RATE);

    // --- Breathing Signal Extraction ---
    const breathingSignal = bandpassFilter(interpolated, SAMPLING_RATE, 0.15, 0.4);

    // 3. Apply a window function (Hanning) to reduce spectral leakage
    const windowed = interpolated.map((val, i) => {
        const hanning = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (interpolated.length - 1)));
        return val * hanning;
    });

    // 4. Perform FFT
    const fftResult = fft(windowed);

    // 5. Calculate Power Spectral Density (PSD)
    const n = fftResult.length;
    const psd = fftResult.map(c => (c.re * c.re + c.im * c.im) / (SAMPLING_RATE * n));

    // 6. Integrate power in frequency bands
    const VLF_BAND = [0.003, 0.04];
    const LF_BAND = [0.04, 0.15];
    const HF_BAND = [0.15, 0.4];
    const freqResolution = SAMPLING_RATE / n;

    let vlfPower = 0;
    let lfPower = 0;
    let hfPower = 0;
    const psdData = [];

    for (let i = 1; i < n / 2; i++) { // Only need to iterate through the first half
        const freq = i * freqResolution;
        if (freq > 0.5) break; // Stop if we go beyond the typical HRV range for visualization

        psdData.push({ x: freq, y: psd[i] });

        if (freq >= VLF_BAND[0] && freq < VLF_BAND[1]) {
            vlfPower += psd[i];
        }
        if (freq >= LF_BAND[0] && freq < LF_BAND[1]) {
            lfPower += psd[i];
        }
        if (freq >= HF_BAND[0] && freq < HF_BAND[1]) {
            hfPower += psd[i];
        }
    }

    // Multiply by resolution to get the actual power
    vlfPower *= freqResolution;
    lfPower *= freqResolution;
    hfPower *= freqResolution;

    return {
        vlf: vlfPower,
        lf: lfPower,
        hf: hfPower,
        lfhfRatio: hfPower > 0 ? lfPower / hfPower : 0,
        psdData: psdData,
        breathingSignal,
    };
}

/**
 * Performs a Fast Fourier Transform (FFT).
 * Input array length must be a power of 2.
 * @param {number[]} data - The input signal.
 * @returns {{re: number, im: number}[]} Array of complex numbers.
 */
function fft(data) {
    // Pad data to the next power of 2
    const n = 1 << Math.ceil(Math.log2(data.length));
    while (data.length < n) data.push(0);

    const complexData = data.map(val => ({ re: val, im: 0 }));

    function cooleyTukey(arr) {
        const N = arr.length;
        if (N <= 1) return arr;

        const even = cooleyTukey(arr.filter((_, i) => i % 2 === 0));
        const odd = cooleyTukey(arr.filter((_, i) => i % 2 !== 0));

        const result = new Array(N);
        for (let k = 0; k < N / 2; k++) {
            const t = {
                re: Math.cos(-2 * Math.PI * k / N) * odd[k].re - Math.sin(-2 * Math.PI * k / N) * odd[k].im,
                im: Math.cos(-2 * Math.PI * k / N) * odd[k].im + Math.sin(-2 * Math.PI * k / N) * odd[k].re
            };
            result[k] = { re: even[k].re + t.re, im: even[k].im + t.im };
            result[k + N / 2] = { re: even[k].re - t.re, im: even[k].im - t.im };
        }
        return result;
    }

    return cooleyTukey(complexData);
}

/**
 * Performs cubic spline interpolation on a dataset.
 * @param {number[]} x - The x-coordinates of the data points.
 * @param {number[]} y - The y-coordinates of the data points.
 * @param {number} samplingRate - The desired sampling rate in Hz for the output.
 * @returns {number[]} The interpolated, evenly sampled y-values.
 */
function cubicSplineInterpolation(x, y, samplingRate) {
    const n = x.length;
    const h = Array(n).fill(0);
    for (let i = 0; i < n - 1; i++) h[i] = x[i + 1] - x[i];

    const alpha = Array(n).fill(0);
    for (let i = 1; i < n - 1; i++) {
        alpha[i] = (3 / h[i]) * (y[i + 1] - y[i]) - (3 / h[i - 1]) * (y[i] - y[i - 1]);
    }

    const l = Array(n).fill(1);
    const mu = Array(n).fill(0);
    const z = Array(n).fill(0);
    for (let i = 1; i < n - 1; i++) {
        l[i] = 2 * (x[i + 1] - x[i - 1]) - h[i - 1] * mu[i - 1];
        mu[i] = h[i] / l[i];
        z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
    }

    const c = Array(n).fill(0);
    const b = Array(n).fill(0);
    const d = Array(n).fill(0);
    for (let j = n - 2; j >= 0; j--) {
        c[j] = z[j] - mu[j] * c[j + 1];
        b[j] = (y[j + 1] - y[j]) / h[j] - (h[j] * (c[j + 1] + 2 * c[j])) / 3;
        d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
    }

    const interpolated = [];
    const step = 1 / samplingRate;
    for (let t = x[0]; t < x[x.length - 1]; t += step) {
        let i = x.findIndex(val => val > t) - 1;
        if (i < 0) i = 0;
        const dx = t - x[i];
        interpolated.push(y[i] + b[i] * dx + c[i] * dx * dx + d[i] * dx * dx * dx);
    }
    return interpolated;
}

/**
 * Calculates Sample Entropy (SampEn) of a time series.
 * @param {number[]} data - The input time series (e.g., RR intervals).
 * @param {number} m - The pattern length (typically 2).
 * @param {number} r - The tolerance (typically 0.2 * standard deviation of data).
 * @returns {number} The Sample Entropy value.
 */
function calculateSampleEntropy(data, m, r) {
    const n = data.length;
    let A = 0; // Number of matches for m+1
    let B = 0; // Number of matches for m

    for (let i = 0; i < n - m; i++) {
        for (let j = i + 1; j < n - m; j++) {
            // Check for m-length match
            let isMatchM = true;
            for (let k = 0; k < m; k++) {
                if (Math.abs(data[i + k] - data[j + k]) > r) {
                    isMatchM = false;
                    break;
                }
            }

            if (isMatchM) {
                B++;
                // Check for (m+1)-length match
                if (i + m < n && j + m < n && Math.abs(data[i + m] - data[j + m]) <= r) {
                    A++;
                }
            }
        }
    }

    return (A === 0 || B === 0) ? 0 : -Math.log(A / B);
}

/**
 * Calculates Detrended Fluctuation Analysis (DFA) alpha 1.
 * @param {number[]} intervals - The RR intervals.
 * @param {number} [minBox=4] - Minimum box size.
 * @param {number} [maxBox=16] - Maximum box size for short-term (alpha 1).
 * @returns {number} The DFA alpha 1 scaling exponent.
 */
function calculateDfa(intervals, minBox = 4, maxBox = 16) {
    if (intervals.length < maxBox * 2) return 0;

    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const integrated = intervals.reduce((acc, val, i) => {
        acc.push((i > 0 ? acc[i - 1] : 0) + (val - mean));
        return acc;
    }, []);

    const boxSizes = [];
    for (let i = minBox; i <= maxBox; i++) {
        boxSizes.push(i);
    }

    const fluctuations = [];
    for (const n of boxSizes) {
        const numBoxes = Math.floor(integrated.length / n);
        let totalRms = 0;

        for (let i = 0; i < numBoxes; i++) {
            const segment = integrated.slice(i * n, (i + 1) * n);
            const x = Array.from({ length: n }, (_, j) => j);

            // Least squares linear fit for the segment
            const sumX = x.reduce((a, b) => a + b, 0);
            const sumY = segment.reduce((a, b) => a + b, 0);
            const sumXY = x.reduce((acc, val, j) => acc + val * segment[j], 0);
            const sumX2 = x.reduce((acc, val) => acc + val * val, 0);
            
            const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;

            const trend = x.map(val => slope * val + intercept);
            const detrended = segment.map((val, j) => val - trend[j]);
            
            const rms = Math.sqrt(detrended.reduce((acc, val) => acc + val * val, 0) / n);
            totalRms += rms * rms;
        }
        fluctuations.push(Math.sqrt(totalRms / numBoxes));
    }

    // Linear regression on log-log plot
    const logBoxSizes = boxSizes.map(Math.log10);
    const logFluctuations = fluctuations.map(f => f > 0 ? Math.log10(f) : 0).filter(f => f !== 0);
    if (logBoxSizes.length !== logFluctuations.length) return 0; // Avoid errors if fluctuations are zero

    const sumX = logBoxSizes.reduce((a, b) => a + b, 0);
    const sumY = logFluctuations.reduce((a, b) => a + b, 0);
    const sumXY = logBoxSizes.reduce((acc, val, i) => acc + val * logFluctuations[i], 0);
    const sumX2 = logBoxSizes.reduce((acc, val) => acc + val * val, 0);
    const n = logBoxSizes.length;

    const alpha = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    return isNaN(alpha) ? 0 : alpha;
}

/**
 * Calculates SDANN (Standard Deviation of the Average NN intervals for all 5-minute segments).
 * @param {number[]} intervals - An array of RR intervals in milliseconds.
 * @returns {number} The SDANN value.
 */
function calculateSdann(intervals) {
    const fiveMinutesInMs = 5 * 60 * 1000;
    const segmentAverages = [];
    let currentSegmentSum = 0;
    let currentSegmentCount = 0;
    let currentSegmentDuration = 0;

    intervals.forEach(interval => {
        currentSegmentSum += interval;
        currentSegmentCount++;
        currentSegmentDuration += interval;
        if (currentSegmentDuration >= fiveMinutesInMs) {
            segmentAverages.push(currentSegmentSum / currentSegmentCount);
            currentSegmentSum = 0;
            currentSegmentCount = 0;
            currentSegmentDuration = 0;
        }
    });

    if (segmentAverages.length < 2) return 0;

    const meanOfAverages = segmentAverages.reduce((a, b) => a + b, 0) / segmentAverages.length;
    const variance = segmentAverages.map(avg => Math.pow(avg - meanOfAverages, 2)).reduce((a, b) => a + b, 0) / segmentAverages.length;
    return Math.sqrt(variance);
}

/**
 * Filters artifacts from an array of RR intervals using a moving median filter.
 * @param {number[]} intervals - The raw RR intervals.
 * @param {number} [windowSize=5] - The size of the moving window (must be odd).
 * @param {number} [threshold=0.2] - The fractional threshold for deviation (e.g., 0.2 for 20%).
 * @returns {{filteredIntervals: number[], correctedCount: number}}
 */
function filterRrArtifacts(intervals, windowSize = 5, threshold = 0.2) {
    if (windowSize % 2 === 0) {
        console.warn("Window size for artifact filter must be odd. Incrementing.");
        windowSize++;
    }
    const halfWindow = Math.floor(windowSize / 2);
    const filtered = [...intervals];
    let correctedCount = 0;

    for (let i = 0; i < intervals.length; i++) {
        const start = Math.max(0, i - halfWindow);
        const end = Math.min(intervals.length, i + halfWindow + 1);
        const window = intervals.slice(start, end);
        
        // Calculate median of the window
        const sortedWindow = [...window].sort((a, b) => a - b);
        const median = sortedWindow[Math.floor(sortedWindow.length / 2)];

        // Check if the current interval is an artifact
        if (Math.abs(intervals[i] - median) > median * threshold) {
            filtered[i] = median; // Replace artifact with median
            correctedCount++;
        }
    }
    return { filteredIntervals: filtered, correctedCount };
}

/**
 * Creates data for an RR interval histogram.
 * @param {number[]} intervals - Array of RR intervals.
 * @param {number} [binSize=20] - The width of each histogram bin in ms.
 * @returns {{labels: string[], data: number[]}}
 */
function createRrHistogram(intervals, binSize = 20) {
    if (intervals.length === 0) return { labels: [], data: [] };

    const min = Math.min(...intervals);
    const max = Math.max(...intervals);

    const startBin = Math.floor(min / binSize) * binSize;
    const endBin = Math.ceil(max / binSize) * binSize;

    const bins = new Map();
    for (let i = startBin; i <= endBin; i += binSize) {
        bins.set(i, 0);
    }

    intervals.forEach(interval => {
        const bin = Math.floor(interval / binSize) * binSize;
        if (bins.has(bin)) {
            bins.set(bin, bins.get(bin) + 1);
        }
    });

    return {
        labels: Array.from(bins.keys()).map(k => `${k}-${k + binSize}`),
        data: Array.from(bins.values())
    };
}

/**
 * A simple bandpass filter implementation for extracting a breathing signal.
 * @param {number[]} data - The evenly sampled input signal.
 * @param {number} sampleRate - The sampling rate of the data.
 * @param {number} lowCutoff - The low cutoff frequency (Hz).
 * @param {number} highCutoff - The high cutoff frequency (Hz).
 * @returns {number[]} The filtered signal.
 */
function bandpassFilter(data, sampleRate, lowCutoff, highCutoff) {
    // This is a simplified filter for demonstration.
    // High-pass filter (removes very slow trends) by subtracting a long moving average
    const longWindowSize = Math.round(sampleRate / lowCutoff);
    const highPassed = data.map((val, i, arr) => {
        if (i < longWindowSize) return 0;
        const window = arr.slice(i - longWindowSize, i);
        const mean = window.reduce((a, b) => a + b, 0) / window.length;
        return val - mean;
    });

    // Low-pass filter (removes very fast noise) with a shorter moving average
    const shortWindowSize = Math.round(sampleRate / highCutoff);
    const lowPassed = [];
    for (let i = 0; i < highPassed.length; i++) {
        const start = Math.max(0, i - Math.floor(shortWindowSize / 2));
        const end = Math.min(highPassed.length, i + Math.floor(shortWindowSize / 2) + 1);
        const window = highPassed.slice(start, end);
        const mean = window.reduce((a, b) => a + b, 0) / window.length;
        lowPassed.push(mean);
    }
    
    return lowPassed;
}

/**
 * Calculates HRV metrics over a rolling window.
 * @param {number[]} intervals - Cleaned RR intervals in ms.
 * @param {number} [windowSeconds=60] - The size of the window in seconds.
 * @param {number} [stepSeconds=10] - How far to move the window for each calculation.
 * @returns {{time: number[], hr: number[], rmssd: number[], sdnn: number[], pnn50: number[], recovery: number[], strain: number[]}}
 */
function calculateRollingHrvMetrics(intervals, windowSeconds = 60, stepSeconds = 10) {
    const results = { time: [], hr: [], rmssd: [], sdnn: [], pnn50: [], recovery: [], strain: [] };
    if (intervals.length < 10) return results;

    const timeAxis = [0];
    for (let i = 0; i < intervals.length - 1; i++) {
        timeAxis.push(timeAxis[i] + intervals[i]);
    }

    const totalDuration = timeAxis[timeAxis.length - 1];
    const windowMs = windowSeconds * 1000;
    const stepMs = stepSeconds * 1000;

    for (let t = 0; t <= totalDuration - windowMs; t += stepMs) {
        const windowStart = t;
        const windowEnd = t + windowMs;

        const startIndex = timeAxis.findIndex(time => time >= windowStart);
        let endIndex = timeAxis.findIndex(time => time >= windowEnd);
        if (endIndex === -1) endIndex = intervals.length;

        const windowIntervals = intervals.slice(startIndex, endIndex);

        if (windowIntervals.length < 5) continue;

        const sum = windowIntervals.reduce((a, b) => a + b, 0);
        const meanRR = sum / windowIntervals.length;

        // HR
        results.hr.push(Math.round(60000 / meanRR));

        // SDNN
        const sdnn = Math.sqrt(windowIntervals.map(x => Math.pow(x - meanRR, 2)).reduce((a, b) => a + b, 0) / windowIntervals.length);
        results.sdnn.push(Math.round(sdnn));

        // RMSSD & pNN50
        if (windowIntervals.length > 1) {
            const successiveDifferences = [];
            let nn50Count = 0;
            for (let i = 0; i < windowIntervals.length - 1; i++) {
                const diff = Math.abs(windowIntervals[i + 1] - windowIntervals[i]);
                successiveDifferences.push(Math.pow(diff, 2));
                if (diff > 50) nn50Count++;
            }
            const rmssd = Math.sqrt(successiveDifferences.reduce((a, b) => a + b, 0) / successiveDifferences.length);
            const pnn50 = (nn50Count / (windowIntervals.length - 1)) * 100;
            results.rmssd.push(Math.round(rmssd));
            results.pnn50.push(parseFloat(pnn50.toFixed(1)));

            // Wellness Scores for the window
            const lfhfRatio = 0; // Note: Calculating rolling frequency is too intensive here. We'll base strain on HR for now.
            const rmssd_norm = normalizeValue(rmssd, 15, 80);
            const hr_norm_inv = normalizeValue(meanRR, 50, 90, true);
            const recoveryScore = Math.round(((rmssd_norm * 0.7) + (hr_norm_inv * 0.3)) * 100);
            results.recovery.push(recoveryScore);

            const hr_norm = normalizeValue(meanRR, 50, 90);
            const strainScore = Math.round(hr_norm * 100); // Simplified strain score for rolling window
            results.strain.push(strainScore);
        }

        results.time.push(Math.round(windowEnd / 1000)); // Time in seconds at end of window
    }

    return results;
}

function normalizeValue(value, min, max, invert = false) {
    let normalized = (value - min) / (max - min);
    normalized = Math.max(0, Math.min(1, normalized)); // Clamp between 0 and 1
    return invert ? 1 - normalized : normalized;
}

/**
 * Main analysis function that takes raw RR data text and returns a full analysis object.
 * @param {string} rrDataText - Raw text data with one RR interval per line.
 * @param {object} [filterSettings={}] - Optional settings for the artifact filter.
 * @returns {object} A comprehensive HRV analysis object.
 */
export function analyzeHrv(rrDataText, filterSettings = {}) {
    const rawIntervals = rrDataText
        .split('\n')
        .map(line => parseFloat(line.trim()))
        .filter(val => !isNaN(val) && val > 0);

    return parseAndAnalyzeRrData(rawIntervals, filterSettings);
}