import { dashboardState } from './dashboardState.js';
import { debounce } from '../../core/utils.js';

export function addDashboardEventListeners(view, container) {
    const grid = container.querySelector('#dashboard-grid');
    if (!grid) return;

    const resetBtn = container.querySelector('#reset-layout-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            localStorage.removeItem('dashboardWidgetOrder');
            view.app.uiManager.showNotification('Dashboard layout has been reset.', 'info');
            view.render(container);
        });
    }
    const configureBtn = container.querySelector('#configure-widgets-btn');
    if (configureBtn) {
        configureBtn.addEventListener('click', () => {
            view.showWidgetConfigModal();
            view.render(container);
        });
    }

    const iceSearchInput = container.querySelector('#ice-search');
    if (iceSearchInput) {
        iceSearchInput.addEventListener('input', debounce(view.handleIceSearch, 300));
    }

    grid.addEventListener('click', e => {
        const target = e.target.closest('[data-action], .expand-icon');
        if (!target) return;

        // Handle expand icon separately as it doesn't use data-action
        if (target.classList.contains('expand-icon')) {
            const widgetId = target.dataset.widgetId;
            view.handleWidgetExpand(widgetId);
            return;
        }

        const action = target.dataset.action;
        const memberId = target.dataset.memberId;

        if (action === 'view-member') {
            view.app.router.navigate(`#/crm/members/edit/${memberId}`);
        }
        if (action === 'edit-member') {
            view.app.router.navigate(`#/crm/members/edit/${memberId}`);
        }
        if (action === 'edit-schema') {
            const schemaId = target.dataset.schemaId;
            view.app.router.navigate(`#/gym/schemas/edit/${schemaId}`);
        }
        if (action === 'delete-member') {
            const memberIdToDelete = target.dataset.memberId;
            view.app.uiManager.showConfirmation('Delete Member', 'Are you sure you want to delete this member? This cannot be undone.').then(confirmed => {
                if (confirmed) {
                    view.dataStore.deleteMember(memberIdToDelete);
                    view.app.uiManager.showNotification('Member deleted.', 'success');
                    view.updateSingleWidget('member-management');
                }
            });
        }
        if (action === 'delete-employee') {
            const employeeId = target.dataset.employeeId;
            view.app.uiManager.showConfirmation('Delete Employee', 'Are you sure you want to delete this employee?').then(confirmed => {
                if (confirmed) {
                    view.dataStore.deleteEmployee(employeeId);
                    view.app.uiManager.showNotification('Employee deleted.', 'success');
                    view.updateSingleWidget('employee-management');
                }
            });
        }
        if (action === 'bt-connect') {
            view.app.bluetoothService.scanAndConnect();
        }
        if (action === 'bt-disconnect') {
            view.app.uiManager.showConfirmation('Disconnect Device?', 'Are you sure you want to disconnect the Bluetooth device?').then(confirmed => {
                if (confirmed) view.app.bluetoothService.disconnect();
            });
        }
        if (action === 'go-to-billing') {
            view.app.router.navigate('#/billing');
        }

        const logId = target.dataset.logId;
        if (action === 'leave-note') {
            view.app.router.navigate(`#/leave-note/${logId}`);
        }
        if (action === 'schedule-follow-up') {
            const log = view.app.dataStore.getWorkoutLogs().find(l => l.id == logId);
            if (log) {
                view.app.router.navigate('#/calendar', { prefill: { userId: log.userId, date: log.date } });
            } else {
                view.app.uiManager.showNotification('Could not find log to schedule follow-up.', 'error');
            }
        }
        if (action === 'delete-log') {
            view.app.uiManager.showConfirmation('Delete Activity Log?', 'Are you sure you want to permanently delete this log?').then(confirmed => {
                if (confirmed) {
                    view.app.dataStore.deleteWorkoutLog(logId).then(() => {
                        view.app.uiManager.showNotification('Log deleted.', 'success');
                        view.updateSingleWidget('recent-activity');
                    });
                }
            });
        }
        if (action === 'manage-subscription') {
            const memberIdForSub = target.dataset.memberId;
            view.app.router.navigate(`#/crm/subscription/${memberIdForSub}`);
        }
        if (action === 'view-age-category') {
            const category = target.closest('li').dataset.category;
            view.showAgeCategoryModal(category);
        }
        if (action === 'view-trainer-ratings') {
            const trainerId = target.closest('tr').dataset.trainerId;
            view.showTrainerRatingsModal(trainerId);
        }
        if (action === 'dashboard-upload-rr') {
            view.app.fileService.openFilePicker({ accept: '.txt,.csv' }).then(async (files) => {
                if (!files || files.length === 0) return;
                const file = files[0];
                await view.handleDashboardRrUpload(file);
            });
        }
    });

    view.boundBluetoothHandler = () => view.updateSingleWidget('bluetooth-manager');
    view.app.bluetoothService.on('connectionStateChange', view.boundBluetoothHandler);

    // --- Drag and Drop Logic ---
    let draggedItem = null;

    grid.addEventListener('dragstart', e => {
        if (e.target.classList.contains('widget')) {
            draggedItem = e.target;
            // Add a slight delay to allow the browser to capture the drag image
            setTimeout(() => {
                if (draggedItem) draggedItem.style.opacity = '0.5';
            }, 0);
        }
    });

    grid.addEventListener('dragend', e => {
        if (draggedItem) {
            setTimeout(() => {
                if (draggedItem) draggedItem.style.opacity = '1';
                const widgetElements = grid.querySelectorAll('.widget');
                const newOrder = Array.from(widgetElements).map(widget => widget.id);
                localStorage.setItem('dashboardWidgetOrder', JSON.stringify(newOrder));
                view.app.uiManager.showNotification('Layout saved!', 'success');
                draggedItem = null;
            }, 0);
        }
    });

    grid.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = view.getDragAfterElement(grid, e.clientY);
        if (draggedItem) {
            if (afterElement == null) {
                grid.appendChild(draggedItem);
            } else {
                grid.insertBefore(draggedItem, afterElement);
            }
        }
    });

    // --- Search and Filter Listeners ---
    const memberSearchInput = container.querySelector('#member-search-input');
    if (memberSearchInput) {
        memberSearchInput.addEventListener('input', debounce(e => {
            dashboardState.memberManagementState.searchTerm = e.target.value;
            view.updateSingleWidget('member-management');
        }, 300));
    }
    const memberStatusFilter = container.querySelector('#member-status-filter');
    if (memberStatusFilter) {
        memberStatusFilter.addEventListener('change', e => {
            dashboardState.memberManagementState.statusFilter = e.target.value;
            view.updateSingleWidget('member-management');
        });
    }
    const employeeSearchInput = container.querySelector('#employee-search-input');
    if (employeeSearchInput) {
        employeeSearchInput.addEventListener('input', debounce(e => {
            dashboardState.employeeManagementState.searchTerm = e.target.value;
            view.updateSingleWidget('employee-management');
        }, 300));
    }
    const employeeRoleFilter = container.querySelector('#employee-role-filter');
    if (employeeRoleFilter) {
        employeeRoleFilter.addEventListener('change', e => {
            dashboardState.employeeManagementState.roleFilter = e.target.value;
            view.updateSingleWidget('employee-management');
        });
    }
}