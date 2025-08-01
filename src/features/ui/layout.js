let sortableInstance;

function initResizableWidgets() {
    const widgets = document.querySelectorAll('.widget');
    const savedSizes = JSON.parse(localStorage.getItem('gymcrm-widget-sizes')) || {};

    // Apply saved sizes on load
    widgets.forEach(widget => {
        if (savedSizes[widget.id]) {
            widget.style.width = savedSizes[widget.id].width;
            widget.style.height = savedSizes[widget.id].height;
        }
    });

    // Use ResizeObserver to save new sizes after user finishes resizing
    widgets.forEach(widget => {
        let resizeTimeout;
        new ResizeObserver(() => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const currentSizes = JSON.parse(localStorage.getItem('gymcrm-widget-sizes')) || {};
                currentSizes[widget.id] = { width: widget.style.width, height: widget.style.height };
                localStorage.setItem('gymcrm-widget-sizes', JSON.stringify(currentSizes));
            }, 500); // Debounce saving to avoid excessive writes
        }).observe(widget);
    });
}

function initDragAndDrop(showNotification) {
    const grid = document.querySelector('.dashboard-grid');
    sortableInstance = new Sortable(grid, {
        animation: 150,
        ghostClass: 'widget-ghost',
        chosenClass: 'widget-chosen',
        handle: '.widget-header',
        onEnd: () => {
            const widgetOrder = Array.from(grid.children).map(w => w.id);
            localStorage.setItem('gymcrm-widget-order', JSON.stringify(widgetOrder));
            showNotification('Layout saved!');
        },
    });

    // Apply saved order on load
    const savedOrder = JSON.parse(localStorage.getItem('gymcrm-widget-order'));
    if (savedOrder) {
        savedOrder.forEach(widgetId => {
            const widget = document.getElementById(widgetId);
            if (widget) grid.appendChild(widget);
        });
    }
}

export function initLayout(showNotification) {
    initResizableWidgets();
    initDragAndDrop(showNotification);
}

export function getSortableInstance() {
    return sortableInstance;
}