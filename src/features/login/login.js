
/**
 * @class loginView
 * @description Renders and manages the login form.
 */
export default class loginView {
    constructor() {
        // No dependencies needed for this simple view
    }

    render(container) {
        container.innerHTML = `
            <div class="login-container">
                <h2>${LocalizationService.t('login.title')}</h2>
                <form id="login-form">
                    <div class="form-group">
                        <label for="username">Email</label>
                        <input type="email" id="username" value="member@cute.com" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" value="password" required>
                    </div>
                    <div class="form-group">
                        <input type="checkbox" id="remember">
                        <label for="remember">${LocalizationService.t('login.rememberMe')}</label>
                    </div>
                    <button type="submit" class="button-primary">${LocalizationService.t('login.button')}</button>
                </form>
            </div>`;

        this.addEventListeners();
    }

    addEventListeners() {
        document.getElementById('login-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember').checked;

            if (app.login({ username, password, remember })) {
                window.location.hash = '#/dashboard';
                window.location.reload();
            } else {
                alert(LocalizationService.t('login.failed'));
            }
        });
    }
}