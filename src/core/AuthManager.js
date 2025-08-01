// File: src/core/AuthManager.js
/**
 * @class AuthManager
 * @description Manages user authentication, tokens, and sessions.
 */
class AuthManager {
    constructor(dataStore) {
        this.dataStore = dataStore;
        this.currentUser = null;
        this.sessionToken = localStorage.getItem('cute-token');
    }

    init() {
        if (this.sessionToken) {
            const userId = atob(this.sessionToken).split(':')[1];
            this.currentUser = this.dataStore.getUsers().find(u => u.id == userId);
        }
    }

    login(username, password) {
        const user = this.dataStore.getUsers().find(u => u.username === username && u.password === password);
        if (user) {
            this.currentUser = user;
            this.sessionToken = btoa(`${user.username}:${user.id}`); // Simple mock token
            localStorage.setItem('cute-token', this.sessionToken);
            return true;
        }
        return false;
    }

    register(name, username, password) {
        const newUser = this.dataStore.addUser({ name, username, password });
        return newUser;
    }

    logout() {
        this.currentUser = null;
        this.sessionToken = null;
        localStorage.removeItem('cute-token');
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

export default AuthManager;