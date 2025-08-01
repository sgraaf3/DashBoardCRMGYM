export function addDashboardEventListeners(container, app) {
    container.querySelector('#create-workout-plan-btn').addEventListener('click', () => {
        app.router.navigate('#/gym/schemas/add');
    });

    container.querySelector('#add-new-member-btn').addEventListener('click', () => {
        app.router.navigate('#/crm/members/add');
    });
}