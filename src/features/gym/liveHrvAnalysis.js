/**
 * @module LiveHrvAnalysis
 * @description Provides real-time analysis of Heart Rate Variability (HRV).
 */

/**
 * @class LiveHrvAnalysis
 * @description Calculates HRV metrics from a stream of R-R intervals.
 *              This implementation focuses on the time-domain metric SDNN.
 */
export default class LiveHrvAnalysis {
    constructor(windowSize = 30) {
        this.rrIntervals = []; // Stores R-R intervals in milliseconds
        this.windowSize = windowSize; // Number of intervals to use for calculation
    }

    /**
     * Adds a new R-R interval to the data set.
     * @param {number} rrInterval - The time in ms between two consecutive R-waves.
     */
    addRRInterval(rrInterval) {
        this.rrIntervals.push(rrInterval);
        // Keep the array at a maximum size to manage memory
        if (this.rrIntervals.length > this.windowSize) {
            this.rrIntervals.shift(); // Remove the oldest interval
        }
    }

    /**
     * Calculates the Standard Deviation of NN intervals (SDNN).
     * @returns {number|null} The calculated SDNN value in ms, or null if not enough data.
     */
    getSDNN() {
        if (this.rrIntervals.length < 5) return null;
        const mean = this.rrIntervals.reduce((a, b) => a + b, 0) / this.rrIntervals.length;
        const variance = this.rrIntervals.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / this.rrIntervals.length;
        return Math.sqrt(variance);
    }

    reset() {
        this.rrIntervals = [];
    }
}