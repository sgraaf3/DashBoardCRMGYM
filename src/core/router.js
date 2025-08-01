class Router {
    constructor(app) {
        this.app = app;
        this.routes = [];
        this.mainContent = document.getElementById('main-content');
        window.addEventListener('hashchange', () => this.handleRouteChange());
    }

    addRoute(route) {
        this.routes.push(route);
    }

    navigate(path, data = {}) {
        // Store data in session storage if needed for the next route
        if (Object.keys(data).length > 0) {
            sessionStorage.setItem('routeData', JSON.stringify(data));
        }
        window.location.hash = path;
    }

    async handleRouteChange() {
        let hash = window.location.hash.slice(2) || '';

        // Retrieve and clear route data
        let routeData = null;
        try {
            routeData = JSON.parse(sessionStorage.getItem('routeData'));
            sessionStorage.removeItem('routeData');
        } catch (e) {
            console.error("Error parsing route data from session storage:", e);
        }

        if (this.app.authManager.isAuthenticated()) {
            // If authenticated, default to dashboard
            if (hash === '' || hash === 'login' || hash === 'register') {
                window.location.hash = '#/dashboard';
                return; // Let hash change re-trigger the router
            }
        } else {
            // If not authenticated, only allow login/register
            if (hash !== 'login' && hash !== 'register') {
                window.location.hash = '#/login';
                return; // Let hash change re-trigger the router
            }
        }

        const matchedRoute = this.routes.map(route => {
            const paramNames = [];
            // Match parameters like :id, store their names, and replace with a regex group
            const regexPath = route.path.replace(/:(\w+)/g, (_, paramName) => {
                paramNames.push(paramName);
                return '([^/]+)';
            });

            const routeRegex = new RegExp(`^${regexPath}$`);
            const match = hash.match(routeRegex);
            if (match) {
                const params = paramNames.reduce((acc, name, index) => {
                    acc[name] = decodeURIComponent(match[index + 1]);
                    return acc;
                }, {});
                return { route, params };
            }
            return null;
        }).find(r => r !== null);

        if (matchedRoute) {
            let { route, params } = matchedRoute;
            let model = null;

          

            // Data resolver function
            if (route.resolve) {
                model = route.resolve(this.app, params);
                if (model === undefined && params.id) { // Resolver can return undefined if not found
                    this.mainContent.innerHTML = `<h2>404 - Not Found</h2><p>The requested resource with ID ${params.id} was not found.</p>`;
                    return;
                }
            }

            // Custom handler for special cases
            if (route.handler) {
                route.handler.call(this, view, params, model, routeData);
                return;
            }

            // Modal handling
            if (route.isModal) {
                const title = typeof route.title === 'function' ? route.title(this.app.localizationService, model) : route.title;
                this.app.uiManager.showModal(title, '', () => {
                    // Standardize render signature for modal views: render(container, model, callbacks/data)
                    view.render(this.app.uiManager.modalBody, model, routeData);
                });
            } else {
                // Page view
                // The old signature was (container, pathParts, routeData). We now pass model.
                // We pass `model || []` to provide backward compatibility for older views that might expect an iterable `pathParts`.
                view.render(this.mainContent, model || [], routeData);
            }
        } else {
            this.mainContent.innerHTML = `<h2>404 - Page Not Found</h2><p>No view registered for path: ${hash}</p>`;
        }
    }
}

export default Router;