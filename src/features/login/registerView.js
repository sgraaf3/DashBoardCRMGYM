class RegisterView {
    constructor(app) {
        this.app = app;
    }

    render(container) {
        container.innerHTML = `
            <div class="login-container">
                <h2>Create Account</h2>
                <form id="register-form">
                    <div class="form-group">
                        <label for="register-name">Full Name</label>
                        <input type="text" id="register-name" required>
                    </div>
                    <div class="form-group">
                        <label for="register-email">Email (Username)</label>
                        <input type="email" id="register-email" required>
                    </div>
                    <div class="form-group">
                        <label for="register-password">Password</label>
                        <input type="password" id="register-password" required>
                    </div>
                    <div class="form-group">
                        <label for="register-password-confirm">${this.app.localizationService.t('register.confirmPassword')}</label>
                        <input type="password" id="register-password-confirm" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Register</button>
                </form>
                <div class="register-link">
                    <p>Already have an account? <a href="#/login">Login here</a></p>
                </div>
            </div>`;
        this.addEventListeners();
    }

    addEventListeners() {
        document.getElementById('register-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-password-confirm').value;

            if (!name || !email || !password) { return this.app.uiManager.showNotification(this.app.localizationService.t('validation.emptyFields'), 'error'); }
            if (password !== confirmPassword) { return this.app.uiManager.showNotification(this.app.localizationService.t('validation.passwordMismatch'), 'error'); }

            const newUser = this.app.authManager.register(name, email, password);
            if (newUser) {
                this.app.uiManager.showNotification('Registration successful! Please log in.', 'success');
                window.location.hash = '#/login';
            } else {
                this.app.uiManager.showNotification('Registration failed. The email may already be in use.', 'error');
            }
        });
    }
}

export default RegisterView;