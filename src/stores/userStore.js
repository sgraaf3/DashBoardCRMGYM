

export const userStore = {
    data: {
        users: [],
        userConfigs: {},
    },

    init() {
        this.data.users = [{ id: 1, name: 'Admin User', username: 'admin@cutefitness.com', password: 'password', role: 'admin', theme: 'dark' }];
        this.data.userConfigs = { '1': { theme: 'dark', heartRateZones: [] } };
    },

    getUsers() {
        return this.data.users || [];
    },

    getUserById(id) {
        return this.data.users.find(u => u.id == id);
    },

    getUserConfig(userId) {
        return this.data.userConfigs[userId] || {};
    },

    async saveUserConfig(userId, config) {
        if (!this.data.userConfigs[userId]) {
            this.data.userConfigs[userId] = {};
        }
        Object.assign(this.data.userConfigs[userId], config);
    },

    async addUser(userData) {
        const existingUser = this.data.users.find(u => u.username === userData.username);
        if (existingUser) {
            console.warn(`Registration failed: username '${userData.username}' already exists.`);
            return null;
        }
        const newId = (this.data.users[this.data.users.length - 1]?.id || 0) + 1;
        const newUser = {
            id: newId,
            name: userData.name,
            username: userData.username,
            password: userData.password, // In a real app, this would be hashed
            role: 'member', // Default role for new users
            theme: 'light' // Default theme
        };
        this.data.users.push(newUser);
        return newUser;
    },

    async updateUser(id, updatedData) {
        const userIndex = this.data.users.findIndex(u => u.id == id);
        if (userIndex === -1) return null;
        this.data.users[userIndex] = { ...this.data.users[userIndex], ...updatedData };
        return this.data.users[userIndex];
    },

    async deleteUser(id) {
        this.data.users = this.data.users.filter(u => u.id != id);
    },
};