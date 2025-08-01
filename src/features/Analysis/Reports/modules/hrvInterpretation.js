export const GRAPH_EXPLANATIONS = {
    wellness: `
        <p>This graph provides a high-level overview of your physiological state over the course of the measurement. It combines several key metrics into two intuitive scores:</p>
        <ul>
            <li><strong>Recovery Score (0-100):</strong> This score reflects the dominance of your 'rest-and-digest' (parasympathetic) nervous system. It is primarily calculated from your RMSSD and resting heart rate. A higher score indicates a better state of recovery, suggesting your body is ready for strain.</li>
            <li><strong>Strain Score (0-100):</strong> This score reflects the level of stress or load on your system. It is calculated from your heart rate and its variability. A higher score indicates more physiological strain, which is expected during exercise but should be low during rest.</li>
        </ul>
        <p>By tracking these scores over time, you can better understand your body's response to training, sleep, and daily stressors, allowing you to optimize your performance and well-being.</p>
    `,
    tachogram: `
        <p>The Tachogram is the most fundamental view of your heart's activity, plotting each individual beat-to-beat interval (RR interval) over time. It is the raw data from which all other HRV metrics are derived.</p>
        <ul>
            <li><strong>What to look for:</strong> A healthy, well-regulated nervous system produces a 'spiky' and highly variable line, indicating that your heart rate is constantly making micro-adjustments. A flatter line suggests less adaptability and potential fatigue or stress.</li>
            <li><strong>Artifacts:</strong> This graph is also the best place to visually identify artifacts (sudden, non-physiological spikes or dips). The faint grey line shows the original raw data, while the bold colored line shows the data after our automated filter has corrected these artifacts. You can also click on any point to manually remove it.</li>
        </ul>
    `,
    psd: `
        <p>The Power Spectral Density (PSD) plot is an advanced analysis that breaks down your heart rate variability into its underlying frequency components, revealing the influence of different parts of your nervous system.</p>
        <ul>
            <li><strong>HF (High Frequency, 0.15-0.4Hz):</strong> This band, often called the 'respiratory band', is a pure indicator of your 'rest-and-digest' (parasympathetic) nervous system activity. Higher HF power is generally a sign of good recovery.</li>
            <li><strong>LF (Low Frequency, 0.04-0.15Hz):</strong> This band reflects the activity of both the parasympathetic and sympathetic ('fight-or-flight') systems. It is often associated with blood pressure regulation.</li>
            <li><strong>VLF (Very Low Frequency, 0.003-0.04Hz):</strong> This band is less understood but is thought to be related to very slow-acting regulatory systems like hormones and thermoregulation.</li>
        </ul>
    `,
    poincare: `
        <p>The Poincaré Plot is a non-linear analysis method that visualizes the correlation between one heartbeat and the next. It provides a unique, qualitative view of your autonomic nervous system's dynamics.</p>
        <ul>
            <li><strong>Shape:</strong> A healthy, adaptable system typically produces a comet-shaped or elongated ellipse. The 'cloud' of points should be well-distributed. A very tight, circular, or narrow shape can indicate high stress, fatigue, or an overly regular heart rhythm.</li>
            <li><strong>Metrics:</strong> The plot is quantified by <strong>SD1</strong> (the width of the cloud), which reflects short-term, parasympathetic variability, and <strong>SD2</strong> (the length of the cloud), which reflects longer-term, overall variability.</li>
        </ul>
    `,
    histogram: `
        <p>The RR Interval Histogram is a simple but powerful tool that shows the frequency distribution of all your recorded heartbeats. It tells you which heart rate intervals occurred most often during the measurement.</p>
        <ul>
            <li><strong>What to look for:</strong> A wider, more spread-out histogram is a hallmark of high overall HRV, which is generally desirable. It means your heart rate was not 'stuck' in one place. A very tall, narrow peak indicates that most of your heartbeats were very similar in length, which can be a sign of physiological or psychological stress.</li>
        </ul>
    `,
    respiration: `
        <p>This graph shows your estimated breathing pattern, derived from the rhythmic fluctuations in your heart rate known as Respiratory Sinus Arrhythmia (RSA). This is a direct, non-invasive way to observe the connection between your breathing and your nervous system.</p>
        <ul>
            <li><strong>How it works:</strong> When you inhale, your heart rate naturally speeds up. When you exhale, it slows down. The HF band of the PSD plot captures this rhythm. This graph visualizes that rhythm over time.</li>
            <li><strong>Uses:</strong> It's useful for seeing how your breathing rate changes during different states (e.g., rest vs. exercise) and for practicing controlled breathing exercises to actively increase your HRV.</li>
        </ul>
    `
};

export function getWellnessOutcome(analysis) {
    const { recoveryScore, strainScore } = analysis;
    let label = 'Balanced';
    let interpretation = 'Your recovery and strain scores indicate a balanced physiological state, suitable for moderate activity.';
    if (recoveryScore > 70 && strainScore < 30) {
        label = 'Excellent Recovery';
        interpretation = 'Your nervous system is well-recovered and ready for significant strain. This is an ideal state for peak performance.';
    } else if (recoveryScore < 40) {
        label = 'Fatigued / Low Recovery';
        interpretation = 'Your recovery score is low, suggesting accumulated fatigue or stress. Prioritizing rest and active recovery is recommended.';
    } else if (strainScore > 50) {
        label = 'High Strain';
        interpretation = 'Your system is showing signs of high physiological strain. If this was a resting measurement, it could be a red flag for over-reaching or stress.';
    }
    return { score: recoveryScore, label, interpretation };
}

export function getWellnessGoodsBads(analysis) {
    const items = [];
    if (analysis.recoveryScore > 70) items.push({ point: 'High Recovery Score', type: 'good', reason: 'Indicates strong parasympathetic influence and readiness.' });
    if (analysis.recoveryScore < 40) items.push({ point: 'Low Recovery Score', type: 'bad', reason: 'Suggests fatigue or high stress levels.' });
    if (analysis.strainScore < 30) items.push({ point: 'Low Strain Score', type: 'good', reason: 'Shows the body is not under significant physiological stress at rest.' });
    if (analysis.strainScore > 50) items.push({ point: 'High Strain Score', type: 'bad', reason: 'May indicate over-reaching if this was a resting measurement.' });
    return items;
}

export function getTachogramOutcome(analysis) {
    const { rmssd } = analysis;
    let label = 'Moderate Variability';
    let interpretation = 'Your beat-to-beat intervals show a healthy amount of variation.';
    if (rmssd > 60) {
        label = 'High Variability';
        interpretation = 'Excellent beat-to-beat variation, a strong sign of a well-recovered, parasympathetic-dominant state.';
    } else if (rmssd < 20) {
        label = 'Low Variability';
        interpretation = 'Your heart rhythm is very regular, which can be a sign of fatigue, stress, or a dominant sympathetic state.';
    }
    return { score: rmssd, label, interpretation };
}

export function getTachogramGoodsBads(analysis) {
    const items = [];
    if (analysis.rmssd > 60) items.push({ point: 'High RMSSD', type: 'good', reason: 'Strong indicator of parasympathetic activity and recovery.' });
    if (analysis.rmssd < 20) items.push({ point: 'Low RMSSD', type: 'bad', reason: 'May indicate fatigue or a stressed state.' });
    if (analysis.artifactCount > 0) items.push({ point: `${analysis.artifactCount} Artifacts Corrected`, type: 'ok', reason: 'Irregular beats were detected and filtered to ensure accuracy.' });
    return items;
}

export function getPsdOutcome(analysis) { return { score: Math.round(analysis.hf), label: 'Frequency Balance', interpretation: 'This shows the balance of your nervous system activity.' }; }
export function getPsdGoodsBads(analysis) { 
    const items = [];
    if (analysis.lfhfRatio > 2.0) items.push({ point: 'High LF/HF Ratio', type: 'bad', reason: 'May indicate a sympathetic (stress) dominance.' });
    if (analysis.lfhfRatio < 1.0) items.push({ point: 'Low LF/HF Ratio', type: 'good', reason: 'Suggests a parasympathetic (rest) dominance.' });
    return items;
}
export function getPoincareOutcome(analysis) { return { score: analysis.sd1, label: 'Short-Term Variability', interpretation: 'SD1 reflects beat-to-beat variance.' }; }
export function getPoincareGoodsBads(analysis) {
    const items = [];
    if (analysis.sd1 > 40) items.push({ point: 'High SD1', type: 'good', reason: 'Indicates strong parasympathetic activity.' });
    if (analysis.sd2 / analysis.sd1 < 1.5) items.push({ point: 'Low SD2/SD1 Ratio', type: 'bad', reason: 'Can indicate a loss of long-term variability or high stress.' });
    return items;
}
export function getHistogramOutcome(analysis) { return { score: analysis.sdnn, label: 'Overall Variability', interpretation: 'The spread of RR intervals.' }; }
export function getHistogramGoodsBads(analysis) {
    const items = [];
    if (analysis.sdnn > 80) items.push({ point: 'Wide Distribution (High SDNN)', type: 'good', reason: 'Shows a wide range of heart rates, indicating adaptability.' });
    if (analysis.sdnn < 40) items.push({ point: 'Narrow Distribution (Low SDNN)', type: 'bad', reason: 'Suggests a less adaptable, more stressed state.' });
    return items;
}
export function getRespirationOutcome(analysis) { return { score: Math.round(60 / (analysis.breathingSignal.length / 4 / 15)), label: 'Estimated Breath Rate', interpretation: 'Your estimated breaths per minute from RSA.' }; }
export function getRespirationGoodsBads(analysis) { return []; }

function getRecommendations(analysis) {
    const recs = [];
    if (analysis.recoveryScore < 50 || analysis.rmssd < 30) {
        recs.push("Focus on improving sleep quality and quantity. Aim for 7-9 hours in a cool, dark room.");
        recs.push("Consider a low-intensity active recovery session, such as walking or light yoga, instead of high-intensity training.");
        recs.push("Practice controlled breathing exercises. Box breathing (4s in, 4s hold, 4s out, 4s hold) can significantly boost parasympathetic activity.");
    } else {
        recs.push("Your body appears well-recovered and ready for training. You are primed to handle a significant training load today.");
    }
    if (analysis.lfhfRatio > 2.0) {
        recs.push("Your LF/HF ratio is elevated. Incorporate mindfulness or meditation to help reduce sympathetic stress throughout the day.");
    }
    if (analysis.artifactCount > analysis.count * 0.05) { // More than 5% artifacts
        recs.push("A high number of artifacts were detected. Ensure your heart rate monitor has a good connection and is sufficiently moist for your next reading.");
    }
    recs.push("Stay well-hydrated throughout the day, as dehydration can negatively impact HRV.");
    return recs;
}

export function getSummaryPageData(analysis) {
    return {
        isSummary: true,
        title: 'Overall Summary & Recommendations',
        summary: `This HRV analysis indicates a state of **${getWellnessOutcome(analysis).label.toLowerCase()}**. Your key recovery metric, RMSSD, is **${analysis.rmssd}ms**, and your overall wellness score is **${analysis.recoveryScore}/100**. The balance of your nervous system, indicated by the LF/HF ratio, is **${analysis.lfhfRatio}**. These results suggest your body is currently experiencing a ${analysis.lfhfRatio > 1.5 ? 'higher degree of sympathetic (stress) influence' : 'good level of parasympathetic (recovery) influence'}.`,
        recommendations: getRecommendations(analysis)
    };
}