import dataStore from '../core/dataStore.js';
import AuthManager from '../core/authManager.js';
import localizationService from '../features/services/localizationServices.js';
import bluetoothService from '../core/bluetoothService.js';
import PdfService from '../features/services/pdfService.js';
import fileService from '../features/services/fileService.js';
import stylingManager from '../features/services/stylingManager.js';
import UIManager from '../core/uiManager.js';

import BillingCycleService from '../features/billing/billingCycleService.js';
class App {
    constructor() {
        this.dataStore = dataStore;
        this.authManager = new AuthManager(this.dataStore);
        this.localizationService = localizationService;
        this.stylingManager = stylingManager;
        this.uiManager = new UIManager(this.authManager, this.stylingManager, this.localizationService);
        this.pdfService = new PdfService(this.localizationService, this.dataStore);
        this.fileService = fileService;
        this.bluetoothService = bluetoothService;

        class Router {
            constructor(app) {
                this.app = app;
                this.routes = {};
                this.currentRoute = null;
                window.addEventListener('hashchange', this.handleRouteChange.bind(this));
                window.addEventListener('load', this.handleRouteChange.bind(this));
            }

            addRoute({ path, view, handler }) {
                this.routes[path] = { view, handler };
            }


            handleRouteChange() {
                const path = window.location.hash.slice(1) || '/';
                let route = this.routes[path];

                if (!route) {
                    for (const routePath in this.routes) {
                        if (routePath.includes(':') && this.matchRoute(path, routePath)) {
                            route = this.routes[routePath];
                            break;
                        }
                    }
                }






                route = route || this.routes['*'];

                if (route) {

                    this.navigateTo(path);
                } else {
                    //this.showNotFound();
                }
            }

            matchRoute(path, routePath) {
                const pathParts = path.split('/');
                const routeParts = routePath.split('/');

                if (pathParts.length !== routeParts.length) {
                    return false;
                }

                for (let i = 0; i < routeParts.length; i++) {
                    if (routeParts[i].charAt(0) !== ':' && routeParts[i] !== pathParts[i]) {
                        return false;
                    }
                }
                return true;
            }

             /*showNotFound() {
                const mainContent = document.getElementById('main-content');
                if (mainContent) {
                    mainContent.innerHTML = '<div>404 Not Found</div>';
                }
            navigateTo(path) {

                window.location.hash = path;
                this.currentRoute = path;

                let route = this.routes[path];
                if (!route) {
                    for (const routePath in this.routes) {
                        if (routePath.includes(':') && this.matchRoute(path, routePath)) {
                            route = this.routes[routePath];
                            const paramNames = routePath.split('/').filter(part => part.startsWith(':')).map(part => part.slice(1));
                            const pathParts = path.split('/');
                            const routeParts = routePath.split('/');

                            let params = {};
                            for (let i = 0; i < paramNames.length; i++) {
                                let paramName = paramNames[i];
                                let routePart = routeParts[i];
                                if (routePart.startsWith(':')) {
                                    params[paramName] = pathParts[i];
                                }
                            }
                            if (route.handler && typeof route.handler === 'function') {
                                route.handler.call(this, route.view, params, null, route.routeData);
                            } else if (route.view && typeof route.view === 'function') {
                                this.renderView(route.view, params, route.routeData);
                            }
                            return;
                        }
                    }
                }

                if (route) {
                    if (route.handler && typeof route.handler === 'function') {
                        route.handler.call(this, route.view, null, null, route.routeData);
                    } else if (route.view && typeof route.view === 'function') {
                        this.renderView(route.view, null, route.routeData);
                    }
                }

            }
    }
        this.router = new Router(this);

        this.billingCycleService = new BillingCycleService(this);
    }

    async setupRoutes() {
        // Page routes
        this.router.addRoute({ path: 'login', view: () => import('../features/login/loginView.js') });
        this.router.addRoute({ path: 'register', view: () => import('../features/login/registerView.js') });
        this.router.addRoute({ path: 'dashboard', view: () => import('../features/dashboard/dashboardView.js') });
        this.router.addRoute({ path: 'crm', view: () => import('../features/crm/crmView.js') });
        this.router.addRoute({ path: 'gym', view: () => import('../features/gym/gymView.js') });
        this.router.addRoute({ path: 'history', view: () => import('../features/workout/workoutHistoryView.js') });
        this.router.addRoute({ path: 'coaching', view: () => import('../features/gym/coachingDashboardView.js') });

        this.router.addRoute({ path: 'workout-planner-member-progress', view: () => import('../features/gym/workoutPlannerMemberProgressView.js') });
        this.router.addRoute({ path: 'progress', view: () => import('../features/progress/progressView.js') });
        this.router.addRoute({ path: 'reports', view: () => import('../features/Analysis/Reports/reportsView.js') });
        this.router.addRoute({ path: 'settings', view: () => import('../features/settings/settingsView.js') });
        this.router.addRoute({ path: 'analysis', view: () => import('../features/gym/analysisView.js') });
        this.router.addRoute({ path: 'training-analyser', view: () => import('../features/gym/trainingAnalyserView.js') });
        this.router.addRoute({ path: 'billing', view: () => import('../features/billing/billingView.js') });
        this.router.addRoute({
            path: 'profile-settings',
            view: () => import('../features/profile/profileEditView.js'),
            resolve: (app) => app.authManager.getCurrentUser()
        });
        this.router.addRoute({ path: 'general-settings', view: () => import('../features/settings/settingsView.js') });
        this.router.addRoute({ path: 'settings/invoice-templates', view: () => import('../features/settings/invoiceTemplateView.js') });
        this.router.addRoute({ path: 'settings/rooms', view: () => import('../features/settings/roomManagementView.js') });

        this.router.addRoute({ path: 'settings/lessons', view: () => import('../features/settings/lessonScheduleView.js') });

        // Page routes with data resolution
        this.router.addRoute({
            path: 'workout-planner-member-progress/detail/:id',
            view: () => import('../features/progress/memberProgressDetailView.js'),
            resolve: (app, params) => app.dataStore.getMemberById(params.id)
        });
        this.router.addRoute({
            path: 'calendar/:memberId?',
            view: () => import('../features/workout/workoutPlanner.js'),
            resolve: (app, params) => params.memberId ? app.dataStore.getMemberById(params.memberId) : null
        });
        // Redirect old route to the new one for backward compatibility
        this.router.addRoute({
            path: 'workout-planner/:memberId?',
            handler: function(view, params) {
                const memberId = params.memberId || '';
                this.navigate(`#/calendar/${memberId}`);
            }
        });

        // "Modal" routes that are actually pages
        this.router.addRoute({ path: 'crm/members/add', view: () => import('../features/crm/memberModalView.js') });
        this.router.addRoute({
            path: 'crm/members/edit/:id',
            view: () => import('../features/crm/memberModalView.js'),
            resolve: (app, params) => app.dataStore.getMemberById(params.id)
        });
        this.router.addRoute({ path: 'crm/employees/add', view: () => import('../features/crm/employeeModalView.js') });
        this.router.addRoute({
            path: 'crm/employees/edit/:id',
            view: () => import('../features/crm/employeeModalView.js'),
            resolve: (app, params) => app.dataStore.getEmployeeById(params.id)
        });
        this.router.addRoute({ path: 'crm/users/add', view: () => import('../features/crm/userModalView.js') });
        this.router.addRoute({
            path: 'crm/users/edit/:id',
            view: () => import('../features/crm/userModalView.js'),
            resolve: (app, params) => app.dataStore.getUserById(params.id)
        });

        // True modal routes
        this.router.addRoute({
            path: 'gym/schemas/add',
            view: () => import('../features/gym/schemaBuilderView.js'),
            isModal: true,
            title: (t) => t.t('gym.createSchema', 'Create Training Plan')
        });
        this.router.addRoute({
            path: 'gym/schemas/edit/:id',
            view: () => import('../features/gym/schemaBuilderView.js'),
            isModal: true,
            title: (t) => t.t('gym.editSchema', 'Edit Training Plan'),
            resolve: (app, params) => app.dataStore.getWorkoutSchema(params.id)
        });
        this.router.addRoute({
            path: 'settings/rooms/add',
            view: () => import('../features/settings/roomModalView.js'),
            isModal: true,
            title: () => 'Add New Room'
        });
        this.router.addRoute({
            path: 'settings/rooms/edit/:id',
            view: () => import('../features/settings/roomModalView.js'),
            isModal: true,
            title: () => 'Edit Room',
            resolve: (app, params) => app.dataStore.getRoomById(params.id)
        });
        this.router.addRoute({
            path: 'settings/lessons/add',
            view: () => import('../features/settings/lessonModalView.js'),
            isModal: true,
            title: () => 'Add New Lesson Template'
        });
        this.router.addRoute({
            path: 'settings/lessons/edit/:id',
            view: () => import('../features/settings/lessonModalView.js'),
            isModal: true,
            title: () => 'Edit Lesson Template',
            resolve: (app, params) => app.dataStore.getLessonTemplateById(params.id)
        });
        this.router.addRoute({
            path: 'leave-note/:logId',
            view: () => import('../features/workout/leaveNoteModalView.js'),
            isModal: true,
            title: () => 'Add/Edit Note',
            resolve: (app, params) => app.dataStore.getWorkoutLogById(params.logId)
        });

        this.router.addRoute({
            path: 'book-lesson',
            view: () => import('../features/calendar/assignWorkoutModalView.js'), // Use the consolidated modal
            isModal: true,
            title: () => 'Book a Lesson'
        });
        // Modal routes with custom handlers
        this.router.addRoute({
            path: 'assign-workout',
            view: () => import('../features/calendar/assignWorkoutModalView.js'),
            isModal: true,
            title: () => 'Assign Workout'
        });
        this.router.addRoute({
            path: 'crm/subscription/:memberId',
            view: () => import('../features/crm/subscription/subscriptionModalView.js'),
            isModal: true, // isModal helps identify, but handler takes precedence
            handler: function(view, params, model, routeData) { // Use function to get `this` as router
                view.render(params.memberId);
                // This modal handles its own display and uses history.back() on close,
                // so we replicate the old behavior of immediately going back.
                window.history.back();
            }
        });
    }

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('run_tests') === 'true') {
            // If the test flag is present, divert to the test suite runner
            // and skip the normal application initialization.
            return this.runTestSuite();
        }

        // Load all external scripts and wait for them before doing anything else.
        await this._loadDependencies();

        await this.dataStore.init();
        await this.localizationService.init();
        this.authManager.init();
        await this.setupRoutes();
        this.stylingManager.init();
        this.router.handleRouteChange();
        this.billingCycleService.start(); // Start the automated billing
        this.initBluetoothWidget();

        // Hide the main loading overlay now that the app is ready
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }

    _loadExternalScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.onload = () => resolve(url);
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            document.head.appendChild(script);
        });
    }

    async _loadDependencies() {
        const scripts = [
            'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js'
        ];

        try {
            await Promise.all(scripts.map(url => this._loadExternalScript(url)));
            console.log("External libraries (Chart.js, jsPDF) loaded successfully.");
            // Set the global jsPDF variable that the PDF generator expects.
            if (window.jspdf) {
                window.jsPDF = window.jspdf.jsPDF;
            }
        } catch (error) {
            console.error("FATAL: Could not load essential external libraries.", error);
            this.uiManager.showNotification("Error: Failed to load critical components. Please refresh the page.", 'error', 0);
            throw error; // Stop app initialization
        }
    }

    /**
     * Manages the global Bluetooth status widget.
     * Ideally, this logic would live in the UIManager, but it's placed here
     * to adhere to the constraint of not modifying un-provided files.
     */
    initBluetoothWidget() {
        this.createBluetoothStatusWidget();
        this.bluetoothService.on('connectionStateChange', (status) => {
            this.updateBluetoothStatusWidget(status);
        });
        this.bluetoothService.on('error', (message) => {
            this.uiManager.showNotification(`Bluetooth Error: ${message}`, 'error');
        });
    }

    createBluetoothStatusWidget() {
        const appContainer = document.getElementById('app-container');
        if (!appContainer || document.getElementById('bluetooth-status-widget')) return;

        const widget = document.createElement('div');
        widget.id = 'bluetooth-status-widget';
        widget.className = 'bluetooth-widget disconnected';
        widget.innerHTML = `
            <div class="bluetooth-icon">🔌</div>
            <div class="bluetooth-text">Disconnected</div>
            <div class="bluetooth-actions">
                <button id="bt-connect-btn" class="btn-icon" title="Connect to Device">&#128267;</button>
                <button id="bt-disconnect-btn" class="btn-icon" title="Disconnect" style="display: none;">&#128683;</button>
            </div>
        `;

        appContainer.appendChild(widget);

        widget.querySelector('#bt-connect-btn').addEventListener('click', () => {
            this.bluetoothService.scanAndConnect();
        });

        widget.querySelector('#bt-disconnect-btn').addEventListener('click', () => {
            this.bluetoothService.disconnect();
        });
    }

    updateBluetoothStatusWidget({ state, deviceName }) {
        const widget = document.getElementById('bluetooth-status-widget');
        if (!widget) return;

        const iconEl = widget.querySelector('.bluetooth-icon');
        const textEl = widget.querySelector('.bluetooth-text');
        const connectBtn = widget.querySelector('#bt-connect-btn');
        const disconnectBtn = widget.querySelector('#bt-disconnect-btn');

        widget.className = `bluetooth-widget ${state}`;

        switch (state) {
            case 'disconnected':
                iconEl.textContent = '🔌';
                textEl.textContent = 'Disconnected';
                connectBtn.style.display = 'block';
                disconnectBtn.style.display = 'none';
                break;
            case 'connecting':
                iconEl.textContent = '⏳';
                textEl.textContent = 'Connecting...';
                break;
            case 'connected':
                iconEl.textContent = '✅';
                textEl.textContent = deviceName || 'Connected';
                connectBtn.style.display = 'none';
                disconnectBtn.style.display = 'block';
                break;
            case 'error':
                iconEl.textContent = '❌';
                textEl.textContent = 'Error';
                break;
        }
    }

    /**
     * Runs a suite of tests against the application's core logic.
     * This is triggered by adding `?run_tests=true` to the URL.
     * It renders results directly into the DOM, bypassing the main app UI.
     */
    async runTestSuite() {
        // Prepare the DOM for test results
        // --- Setup for all tests that need the app to be configured ---
        // This ensures router, auth, and data are ready for integration-style tests.
        await this.dataStore.init();
        this.authManager.init();
        await this.setupRoutes();

        document.body.innerHTML = `
            <div id="test-runner-container">
                <h1>C.U.T.E. Test Suite Runner</h1>
                <p>Open the developer console (F12) to see detailed test output. Results are also printed below.</p>
                <div id="test-results"></div>
            </div>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333; }
                h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; }
                #test-results { white-space: pre-wrap; font-family: "SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace; background-color: #f7f7f7; padding: 15px; border-radius: 5px; }
                .test-pass { color: #28a745; }
                .test-fail { color: #dc3545; font-weight: bold; }
                .test-suite { font-weight: bold; margin-top: 1em; text-transform: uppercase; letter-spacing: 0.5px; }
            </style>
        `;
        const resultsEl = document.getElementById('test-results');

        // --- Test Helpers ---
        const log = (message, status = 'info') => {
            const p = document.createElement('p');
            p.textContent = message;
            if (status === 'pass') p.classList.add('test-pass');
            if (status === 'fail') p.classList.add('test-fail');
            if (status === 'suite') p.classList.add('test-suite');
            resultsEl.appendChild(p);
            console.log(message);
        };

        const assert = (condition, message) => {
            if (!condition) {
                throw new Error(message);
            }
        };

        // --- Test Suites ---

        // Test Suite: User CRUD, Persistence, and Bootstrap
        const runUserCrudTests = async () => {
            log('--- Running User CRUD, Persistence & Bootstrap Tests ---', 'suite');
            localStorage.removeItem('userStore');
            localStorage.removeItem('employeeStore');
            await this.dataStore.init();
            const initialUserCount = this.dataStore.getUsers().length;
            assert(initialUserCount > 0, `Bootstrap check: Initial bootstrapped user count should be > 0.`);
            log('PASS: Initial data bootstrap logic ran successfully.', 'pass');

            try {
                const newUser = { username: 'testuser-crud', password: 'password123', role: 'Member' };
                const createdUser = await this.dataStore.addUser(newUser);
                assert(createdUser && createdUser.id, 'addUser should return a user with an ID.');
                assert(this.dataStore.getUsers().length === initialUserCount + 1, `User count should be ${initialUserCount + 1}.`);
                log('PASS: addUser created a user successfully.', 'pass');

                const foundUser = this.dataStore.getUserById(createdUser.id);
                assert(foundUser && foundUser.id === createdUser.id, 'getUserById should find the created user.');
                log('PASS: getUserById retrieved the user correctly.', 'pass');

                const updatedUser = await this.dataStore.updateUser(createdUser.id, { role: 'Coach' });
                assert(updatedUser.role === 'Coach', 'updateUser should return the user with updated data.');
                log('PASS: updateUser modified the user successfully.', 'pass');

                await this.dataStore.deleteUser(createdUser.id);
                assert(this.dataStore.getUsers().length === initialUserCount, `User count should be back to ${initialUserCount}.`);
                assert(!this.dataStore.getUserById(createdUser.id), 'getUserById should not find the deleted user.');
                log('PASS: deleteUser removed the user correctly.', 'pass');

                // Persistence check
                const savedData = localStorage.getItem('userStore');
                assert(savedData, 'Data should be persisted to localStorage.');
                log('PASS: Data persistence to localStorage is working.', 'pass');

            } catch (error) {
                log(`FAIL: ${error.message}`, 'fail'); console.error(error);
            } finally {
                localStorage.removeItem('userStore');
                localStorage.removeItem('employeeStore');
            }
        };

        // Test Suite: Event Emitter
        const runEventEmitterTests = async () => {
            log('--- Running Event Emitter Tests ---', 'suite');
            try {
                let listenerCalled = false;
                let receivedData = null;
                const listener = (data) => { listenerCalled = true; receivedData = data; };

                this.dataStore.emitter.on('test-event', listener);
                this.dataStore.emitter.emit('test-event', { message: 'success' });
                assert(listenerCalled && receivedData.message === 'success', "'on' and 'emit' should work with data.");
                log("PASS: Listener was called with correct data.", 'pass');

                listenerCalled = false;
                this.dataStore.emitter.off('test-event', listener);
                this.dataStore.emitter.emit('test-event', { message: 'fail' });
                assert(!listenerCalled, "'off' should remove the listener.");
                log("PASS: Removed listener was not called.", 'pass');
            } catch (error) {
                log(`FAIL: ${error.message}`, 'fail'); console.error(error);
            }
        };

        // Test Suite: AuthManager
        const runAuthManagerTests = async () => {
            log('--- Running AuthManager Tests ---', 'suite');
            const auth = this.authManager;

            try {
                // --- SETUP: Ensure clean state ---
                auth.logout(); // Log out any previous session
                await this.dataStore.init(); // Ensure users are loaded/bootstrapped

                // --- TEST 1: Initial State ---
                log('TEST: Initial state is unauthenticated...');
                assert(!auth.isAuthenticated(), 'Should not be authenticated initially.');
                assert(auth.getCurrentUser() === null, 'Current user should be null initially.');
                log('PASS: Initial state is correct.', 'pass');

                // --- TEST 2: Failed Login ---
                log('TEST: login() fails with bad credentials...');
                const loginFailed = auth.login('baduser', 'badpassword');
                assert(loginFailed === false, 'Login should fail for incorrect credentials.');
                assert(!auth.isAuthenticated(), 'Should remain unauthenticated after failed login.');
                log('PASS: Failed login handled correctly.', 'pass');

                // --- TEST 3: Successful Login ---
                log('TEST: login() succeeds with correct credentials...');
                const loginSuccess = auth.login('admin', 'password'); // Using bootstrapped user
                assert(loginSuccess === true, 'Login should succeed for correct credentials.');
                assert(auth.isAuthenticated(), 'Should be authenticated after successful login.');
                const currentUser = auth.getCurrentUser();
                assert(currentUser !== null, 'Current user should not be null after login.');
                assert(currentUser.username === 'admin', 'Correct user should be set.');
                assert(localStorage.getItem('cute-token') !== null, 'Session token should be set in localStorage.');
                log('PASS: Successful login handled correctly.', 'pass');

                // --- TEST 4: Logout ---
                log('TEST: logout() clears session...');
                auth.logout();
                assert(!auth.isAuthenticated(), 'Should be unauthenticated after logout.');
                assert(auth.getCurrentUser() === null, 'Current user should be null after logout.');
                assert(localStorage.getItem('cute-token') === null, 'Session token should be removed from localStorage.');
                log('PASS: Logout handled correctly.', 'pass');

            } catch (error) {
                log(`FAIL: ${error.message}`, 'fail');
                console.error(error);
            } finally {
                // --- TEARDOWN ---
                auth.logout();
            }
        };

        // Test Suite: Utils
        const runUtilsTests = async () => {
            log('--- Running Utils Tests ---', 'suite');
            const { formDataToObject, debounce, analyzeHrv, filterRrArtifacts } = await import('../core/utils.js');

            try {
                log('TEST: formDataToObject converts FormData to object...');
                const fd = new FormData();
                fd.append('name', 'John Doe');
                fd.append('subscribe', 'newsletter');
                fd.append('subscribe', 'updates');

                const result = formDataToObject(fd);
                assert(result.name === 'John Doe', 'Simple key-value should be correct.');
                assert(Array.isArray(result.subscribe) && result.subscribe.length === 2, 'Multiple values for a key should create an array of correct length.');
                assert(result.subscribe[0] === 'newsletter' && result.subscribe[1] === 'updates', 'Array values should be correct.');
                log('PASS: formDataToObject works correctly.', 'pass');

                log('TEST: debounce delays function execution...');
                let debouncedCounter = 0;
                const increment = () => { debouncedCounter++; };
                const debouncedIncrement = debounce(increment, 50);

                debouncedIncrement();
                debouncedIncrement();
                debouncedIncrement();

                assert(debouncedCounter === 0, 'Debounced function should not execute immediately.');

                await new Promise(resolve => setTimeout(resolve, 100)); // Wait for debounce delay

                assert(debouncedCounter === 1, 'Debounced function should be called only once after multiple rapid calls.');
                log('PASS: debounce works correctly.', 'pass');

                log('TEST: analyzeHrv parses data and calculates basic metrics...');
                const rrDataText = '800\n820\n780\n810';
                const analysis = analyzeHrv(rrDataText);

                assert(analysis, 'Analysis result should not be null.');
                assert(analysis.count === 4, 'Should correctly count the number of intervals.');
                assert(analysis.meanRR === 803, 'Should correctly calculate the mean RR interval.');
                assert(typeof analysis.rmssd === 'number' && analysis.rmssd > 0, 'RMSSD should be a positive number.');
                assert(typeof analysis.sdnn === 'number' && analysis.sdnn > 0, 'SDNN should be a positive number.');
                log('PASS: analyzeHrv works correctly.', 'pass');

                log('TEST: filterRrArtifacts identifies and corrects artifacts...');
                const intervalsWithArtifacts = [800, 810, 400, 805, 815, 1500, 795]; // 400 and 1500 are artifacts
                const { filteredIntervals, correctedCount } = filterRrArtifacts(intervalsWithArtifacts, 5, 0.2);

                assert(correctedCount === 2, `Expected 2 corrected artifacts, but found ${correctedCount}.`);
                // The artifact at index 2 (400) should be replaced by the median of [800, 810, 400, 805, 815] -> sorted [400, 800, 805, 810, 815] -> median 805
                assert(filteredIntervals[2] === 805, `Artifact at index 2 was not corrected properly. Expected 805, got ${filteredIntervals[2]}.`);
                // The artifact at index 5 (1500) should be replaced by the median of [805, 815, 1500, 795] -> sorted [795, 805, 815, 1500] -> median 810 (approx)
                assert(filteredIntervals[5] === 810, `Artifact at index 5 was not corrected properly. Expected 810, got ${filteredIntervals[5]}.`);
                log('PASS: filterRrArtifacts works correctly.', 'pass');

            } catch (error) {
                log(`FAIL: ${error.message}`, 'fail'); console.error(error);
            }
        };

        // Test Suite: Router Authentication Guards
        const runRouterAuthGuardTests = async () => {
            log('--- Running Router Auth Guard Tests ---', 'suite');
            const auth = this.authManager;

            const waitForHashChange = () => new Promise(resolve => {
                const listener = () => {
                    window.removeEventListener('hashchange', listener);
                    resolve(window.location.hash);
                };
                window.addEventListener('hashchange', listener);
            });

            try {
                // --- TEST 1: Unauthenticated user redirected to /login ---
                log('TEST: Unauthenticated user is redirected from protected route to /login...');
                auth.logout();
                window.location.hash = '#/dashboard'; // Trigger route change
                const finalHash1 = await waitForHashChange();
                assert(finalHash1 === '#/login', `Expected hash to be #/login, but it was ${finalHash1}`);
                log('PASS: Redirect to /login was successful.', 'pass');

                // --- TEST 2: Authenticated user redirected from /login ---
                log('TEST: Authenticated user is redirected from /login to /dashboard...');
                auth.login('admin', 'password'); // Log in
                window.location.hash = '#/login'; // Trigger route change
                const finalHash2 = await waitForHashChange();
                assert(finalHash2 === '#/dashboard', `Expected hash to be #/dashboard, but it was ${finalHash2}`);
                log('PASS: Redirect to /dashboard was successful.', 'pass');

            } catch (error) {
                log(`FAIL: ${error.message}`, 'fail');
                console.error(error);
            } finally {
                // --- TEARDOWN ---
                auth.logout();
                window.location.hash = '#/login'; // Reset to a stable state for manual use after tests
            }
        };

        // Test Suite: Router Parameter and Resolver Handling
        const runRouterParameterTests = async () => {
            log('--- Running Router Parameter & Resolver Tests ---', 'suite');
            const auth = this.authManager;
            let tempMember;

            const waitForRouteChange = (expectedContent) => new Promise((resolve, reject) => {
                const observer = new MutationObserver((mutations, obs) => {
                    const mainContent = document.getElementById('main-content');
                    if (mainContent && mainContent.textContent.includes(expectedContent)) {
                        obs.disconnect();
                        resolve();
                    }
                });
                observer.observe(document.getElementById('main-content'), { childList: true, subtree: true });
                setTimeout(() => {
                    observer.disconnect();
                    reject(new Error(`Timeout waiting for content: "${expectedContent}"`));
                }, 1000);
            });

            try {
                auth.login('admin', 'password');
                tempMember = await this.dataStore.addMember({ name: 'Router Test Member', email: 'router@test.com', status: 'Active' });
                assert(tempMember && tempMember.id, 'Setup: Failed to create temporary member.');

                // --- TEST 1: Valid ID resolves correctly ---
                log('TEST: Route with valid parameter resolves data and renders view...');
                window.location.hash = `#/crm/members/edit/${tempMember.id}`;
                await waitForRouteChange('Edit Member'); // MemberModalView has "Edit Member" in its form
                const formTitle = document.getElementById('main-content').querySelector('h3');
                assert(formTitle && formTitle.textContent.includes('Edit Member'), 'The correct view (MemberModalView) should be rendered.');
                log('PASS: Route with valid ID rendered correctly.', 'pass');

                // --- TEST 2: Invalid ID shows 404 ---
                log('TEST: Route with invalid parameter shows 404...');
                window.location.hash = '#/crm/members/edit/invalid-id-123';
                await waitForRouteChange('404 - Not Found');
                const notFoundText = document.getElementById('main-content').textContent;
                assert(notFoundText.includes('The requested resource with ID invalid-id-123 was not found.'), 'A 404 message for the invalid ID should be displayed.');
                log('PASS: Route with invalid ID handled correctly.', 'pass');

            } catch (error) {
                log(`FAIL: ${error.message}`, 'fail');
                console.error(error);
            } finally {
                if (tempMember) await this.dataStore.deleteMember(tempMember.id);
                auth.logout();
                window.location.hash = '#/login';
            }
        };

        // Test Suite: Modal Route Handling
        const runModalRouteTests = async () => {
            log('--- Running Modal Route Tests ---', 'suite');
            const auth = this.authManager;

            const waitForModal = (shouldExist) => new Promise((resolve, reject) => {
                const observer = new MutationObserver(() => {
                    const modalVisible = document.querySelector('.modal-overlay.active');
                    if (shouldExist ? modalVisible : !modalVisible) {
                        observer.disconnect();
                        resolve();
                    }
                });
                observer.observe(document.body, { childList: true, subtree: true });
                setTimeout(() => {
                    observer.disconnect();
                    reject(new Error(`Timeout waiting for modal visibility to be ${shouldExist}`));
                }, 1000);
            });

            try {
                auth.login('admin', 'password');
                log('TEST: Modal route opens a modal...');
                window.location.hash = '#/gym/schemas/add';
                await waitForModal(true);
                const modalTitle = document.querySelector('.modal-title')?.textContent;
                assert(document.querySelector('.modal-overlay.active'), 'Modal overlay should be active.');
                assert(modalTitle && modalTitle.includes('Create Training Plan'), 'Modal title is incorrect.');
                log('PASS: Modal opened successfully.', 'pass');

                log('TEST: Closing modal removes it from the DOM...');
                this.uiManager.hideModal();
                await waitForModal(false);
                assert(!document.querySelector('.modal-overlay.active'), 'Modal overlay should be removed after closing.');
                log('PASS: Modal closed successfully.', 'pass');
            } catch (error) {
                log(`FAIL: ${error.message}`, 'fail'); console.error(error);
            } finally {
                auth.logout();
                window.location.hash = '#/login';
            }
        };

        // Test Suite: Bluetooth Service with Mock API
        const runBluetoothServiceTests = async () => {
            log('--- Running Bluetooth Service Tests ---', 'suite');

            // --- Mock Web Bluetooth API ---
            const mockCharacteristic = {
                listeners: new Map(),
                addEventListener: (event, cb) => {
                    if (!mockCharacteristic.listeners.has(event)) mockCharacteristic.listeners.set(event, []);
                    mockCharacteristic.listeners.get(event).push(cb);
                },
                removeEventListener: (event, cb) => {
                    if (mockCharacteristic.listeners.has(event)) {
                        const cbs = mockCharacteristic.listeners.get(event);
                        const index = cbs.indexOf(cb);
                        if (index > -1) cbs.splice(index, 1);
                    }
                },
                startNotifications: () => Promise.resolve(),
                stopNotifications: () => Promise.resolve(),
                // Test helper to simulate data from device
                _simulateValueChange: (dataView) => {
                    const event = { target: { value: dataView } };
                    mockCharacteristic.listeners.get('characteristicvaluechanged')?.forEach(cb => cb(event));
                }
            };

            const mockService = {
                getCharacteristic: () => Promise.resolve(mockCharacteristic)
            };

            const mockServer = {
                getPrimaryService: () => Promise.resolve(mockService)
            };

            const mockDevice = {
                name: 'MockHRM-123',
                listeners: new Map(),
                addEventListener: (event, cb) => {
                    if (!mockDevice.listeners.has(event)) mockDevice.listeners.set(event, []);
                    mockDevice.listeners.get(event).push(cb);
                },
                gatt: {
                    connected: false,
                    connect: () => {
                        mockDevice.gatt.connected = true;
                        return Promise.resolve(mockServer);
                    },
                    disconnect: () => {
                        mockDevice.gatt.connected = false;
                        mockDevice.listeners.get('gattserverdisconnected')?.forEach(cb => cb());
                    }
                }
            };

            const mockBluetooth = {
                shouldFail: false,
                requestDevice: () => {
                    if (mockBluetooth.shouldFail) return Promise.reject(new Error('User cancelled'));
                    return Promise.resolve(mockDevice);
                }
            };

            // Replace the global navigator.bluetooth with our mock
            navigator.bluetooth = mockBluetooth;
            const btService = this.bluetoothService;

            try {
                // --- TEST 1: Successful Connection ---
                log('TEST: scanAndConnect establishes a connection...');
                await btService.scanAndConnect();
                assert(btService.getState() === 'connected', `Expected state 'connected', got '${btService.getState()}'`);
                assert(btService.getDevice()?.name === 'MockHRM-123', 'Device name should be set.');
                log('PASS: Connection successful.', 'pass');

                // --- TEST 2: Data Reception ---
                log('TEST: Service emits heart rate and RR interval data...');
                let hrReceived, rrReceived;
                const hrListener = (hr) => { hrReceived = hr; };
                const rrListener = (rr) => { rrReceived = rr; };
                btService.on('heartRateUpdate', hrListener);
                btService.on('rrIntervalUpdate', rrListener);

                // Simulate a data packet (Flags: HR=UINT8, RR present)
                const buffer = new ArrayBuffer(4);
                const view = new DataView(buffer);
                view.setUint8(0, 0b00010000); // Flags: RR present
                view.setUint8(1, 75);         // HR: 75
                view.setUint16(2, 820, true); // RR: 820ms (as 1/1024s) -> 800.78ms
                mockCharacteristic._simulateValueChange(view);

                assert(hrReceived === 75, `Expected HR 75, got ${hrReceived}`);
                assert(rrReceived && rrReceived[0] > 800 && rrReceived[0] < 801, `Expected RR ~800.78, got ${rrReceived ? rrReceived[0] : 'undefined'}`);
                log('PASS: Data received and emitted correctly.', 'pass');
                btService.off('heartRateUpdate', hrListener);
                btService.off('rrIntervalUpdate', rrListener);

                // --- TEST 3: Disconnection ---
                log('TEST: disconnect() changes state and cleans up...');
                await btService.disconnect();
                assert(btService.getState() === 'disconnected', `Expected state 'disconnected', got '${btService.getState()}'`);
                log('PASS: Disconnection successful.', 'pass');

            } catch (error) {
                log(`FAIL: ${error.message}`, 'fail'); console.error(error);
            } finally {
                navigator.bluetooth = undefined; // Clean up mock
            }
        };

        // Test Suite: HRV Calculation Validation
        const runHrvValidationTests = async () => {
            log('--- Running HRV Validation Tests ---', 'suite');
            const { analyzeHrv } = await import('../core/utils.js');

            try {
                log('TEST: Validating HRV metrics against a known dataset...');
                // This is a sample dataset with known, pre-calculated values.
                const sampleRrText = "1000\n1020\n980\n1010\n990";
                const expected = {
                    meanRR: 1000,
                    sdnn: 14.1,
                    rmssd: 28.7,
                    pNN50: 0.0
                };

                const result = analyzeHrv(sampleRrText);
                const tolerance = 0.1; // Allow for minor floating point differences

                assert(Math.abs(result.meanRR - expected.meanRR) <= tolerance, `Mean RR validation failed. Expected: ${expected.meanRR}, Got: ${result.meanRR}`);
                assert(Math.abs(result.sdnn - expected.sdnn) <= tolerance, `SDNN validation failed. Expected: ${expected.sdnn}, Got: ${result.sdnn}`);
                assert(Math.abs(result.rmssd - expected.rmssd) <= tolerance, `RMSSD validation failed. Expected: ${expected.rmssd}, Got: ${result.rmssd}`);
                assert(Math.abs(result.pNN50 - expected.pNN50) <= tolerance, `pNN50 validation failed. Expected: ${expected.pNN50}, Got: ${result.pNN50}`);

                log('PASS: All key HRV metrics validated successfully.', 'pass');

            } catch (error) {
                log(`FAIL: ${error.message}`, 'fail');
                console.error(error);
            }
        };

        // --- Run all test suites ---
        await runUserCrudTests();
        await runEventEmitterTests();
        await runAuthManagerTests();
        await runUtilsTests();
        await runRouterAuthGuardTests();
        await runRouterParameterTests();
        await runModalRouteTests();
        await runBluetoothServiceTests();
        await runHrvValidationTests();
    }
        }}}