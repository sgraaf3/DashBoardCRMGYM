class StylingManager {
    constructor() {
        this.currentTheme = 'light';
    }
    init() {
        const savedTheme = localStorage.getItem('cute-theme') || 'light';
        this.applyTheme(savedTheme);
    }
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }
    applyTheme(themeName) {
        this.currentTheme = themeName;
        document.body.className = `theme-${themeName}`;
        localStorage.setItem('cute-theme', themeName);
    }
}

export default new StylingManager();