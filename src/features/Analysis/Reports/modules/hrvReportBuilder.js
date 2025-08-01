import * as interpretations from './hrvInterpretation.js';
import * as chartFactory from './hrvChartFactory.js';

function shouldRenderChart(analysis, chartKey) {
    switch(chartKey) {
        case 'respiration':
        case 'wellness':
            return analysis.rollingMetrics && analysis.rollingMetrics.time.length > 0;
        default:
            return true;
    }
}

function createHrvPage(analysis, chartKey, slot, onClickHandler) {
    const chartConfigGeneratorName = `create${chartKey.charAt(0).toUpperCase() + chartKey.slice(1)}Config`;
    const outcomeGeneratorName = `get${chartKey.charAt(0).toUpperCase() + chartKey.slice(1)}Outcome`;
    const goodsBadsGeneratorName = `get${chartKey.charAt(0).toUpperCase() + chartKey.slice(1)}GoodsBads`;

    const chartConfig = chartFactory[chartConfigGeneratorName](analysis, slot, onClickHandler);

    return {
        title: chartConfig.title,
        chartKey: chartKey,
        explanation: interpretations.GRAPH_EXPLANATIONS[chartKey],
        outcome: interpretations[outcomeGeneratorName](analysis),
        goodsBads: interpretations[goodsBadsGeneratorName](analysis),
        chartConfig: chartConfig
    };
}

export function buildHrvReportPages(analysis, slot, onClickHandler) {
    const pages = [];
    const chartKeys = ['wellness', 'tachogram', 'psd', 'poincare', 'histogram', 'respiration'];

    chartKeys.forEach(key => {
        if (shouldRenderChart(analysis, key)) {
            pages.push(createHrvPage(analysis, key, slot, onClickHandler));
        }
    });

    pages.push(interpretations.getSummaryPageData(analysis));
    return pages;
}