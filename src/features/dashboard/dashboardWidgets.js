import { dashboardState } from './dashboardState.js';
import { buildWidgetConfig } from './widgetConfigBuilder.js';

export function createWidget(config) {
    let expansionLevel = dashboardState.widgetExpandedState[config.id] || 0;
    let content = config.normalContent;

  let width = 'max-content';
  let height = 'max-content';

  if (expansionLevel === 0) {
    content = config.iconOnlyContent || '';
  } else if (expansionLevel === 1 && config.basicDataContent) {
    content = config.basicDataContent;
    width = '4x4';
    height = '4x4';
  } else if (expansionLevel === 2 && config.advancedDataContent) {
    content = config.advancedDataContent;
    width = '6x6';
    height = '6x6';
  }
   else if (expansionLevel === 3 && config.expandedContent) {
        content = config.expandedContentL3;
    }

    const colSpan = config.colSpan ? config.colSpan[expansionLevel] : 1;
    const rowSpan = config.rowSpan ? config.rowSpan[expansionLevel] : 1;

    const colSpanClass = `lg:col-span-${colSpan}`;
    const rowSpanClass = `lg:row-span-${rowSpan}`;

    return `
        <div id="${config.id}" class="widget ${colSpanClass} ${rowSpanClass}" draggable="true" data-widget-id="${config.id}">
            <div class="widget-header">

                <h3>${config.icon} ${config.title}</h3>

            </div>
            <div class="widget-content">
                ${content}
            </div>
        </div>
    `;
}

/*export function toggleWidget(view, widgetId) {
    const currentLevel = dashboardState.widgetExpandedState[widgetId] || 0;
    const config = buildWidgetConfig(view._composeDashboardData(), {
        memberManagementState: dashboardState.memberManagementState,
        employeeManagementState: dashboardState.employeeManagementState,
        bluetoothState: {state: view.app.bluetoothService.getState(),
            deviceName: view.app.bluetoothService.getDevice()?.name},
        employees: view.app.dataStore.getEmployees(),
        hrvAnalysisResult: dashboardState.hrvAnalysisResult
    }).find(c => c.id === widgetId);

    const maxLevel = (config.expandedContentL3 ? 3 : (config.expandedContentL2 ? 2 : (config.expandedContent ? 1 : 0)));
    dashboardState.widgetExpandedState[widgetId] = (currentLevel + 1) % (maxLevel + 1);
    
    updateSingleWidget(view, widgetId);   view.repositionWidgets(document.getElementById('dashboard-grid'))
}*/

export function updateSingleWidget(view, widgetId, dynamicData = null) {
    const widgetElement = document.getElementById(widgetId);
    if (!widgetElement) return;

    const data = view._composeDashboardData();
    const context = {
        memberManagementState: dashboardState.memberManagementState,
        employeeManagementState: dashboardState.employeeManagementState,
        bluetoothState: { state: view.app.bluetoothService.getState(), deviceName: view.app.bluetoothService.getDevice()?.name },
        members: view.app.dataStore.getMembers(), // Add missing members to context
        employees: view.app.dataStore.getEmployees(),
        hrvAnalysisResult: dashboardState.hrvAnalysisResult
    };
    const allWidgetConfigs = buildWidgetConfig(data, context);
    let config = allWidgetConfigs.find(c => c.id === widgetId);

    if (config) {
        // If dynamic data was passed from handleWidgetExpand, generate the content now
        if (dynamicData && config.getExpandedContent) {
            const { html, chart } = config.getExpandedContent(dynamicData, view.localizationService.t);
            // Create a temporary config with the generated content to pass to createWidget
            config = { ...config, expandedContent: html, chart: chart };
        }

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = createWidget(config);
        const newWidgetElement = tempDiv.firstElementChild;

        widgetElement.replaceWith(newWidgetElement);

        view.renderCharts([config]); // Use the potentially updated config for chart rendering
    }
}