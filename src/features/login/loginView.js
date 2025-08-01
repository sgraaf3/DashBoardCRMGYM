class LoginView {
    constructor(app) {
        this.app = app;
    }

    render(container, model = null) {
        container.innerHTML = `
            <div class="login-container">
                <h2>${this.app.localizationService.t('login.title')}</h2>
                <form id="login-form">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" required>
                    </div>
                    <button type="submit" class="btn btn-primary">${this.app.localizationService.t('login.button')}</button>
                </form>
                <div class="register-link">
                    <p>Don't have an account? <a href="#/register">Register here</a></p>
                </div>
            </div>`;
        this.addEventListeners();
    }

    addEventListeners() {
        document.getElementById('login-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            if (this.app.authManager.login(username, password)) {
                // Navigate to the dashboard. The router will handle the view change.
                this.app.router.navigate('#/dashboard');
            } else {
                this.app.uiManager.showNotification(this.app.localizationService.t('login.failed'), 'error');
            }
        });
    }
}

export default LoginView;