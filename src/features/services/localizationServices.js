class LocalizationService {
    constructor() {
        this.translations = {};
        this.currentLanguage = 'en';
    }
    async init(defaultLang = 'en') {
        const savedLang = localStorage.getItem('cute-lang') || defaultLang;
        await this.loadLanguage(savedLang);
    }
    async loadLanguage(lang) {
        try {
            const response = await fetch(`src/assets/${lang}.json`);
            if (!response.ok) throw new Error(`Could not load language file: ${lang}.json`);
            this.translations = await response.json();
            document.documentElement.lang = lang;
            this.currentLanguage = lang;
        } catch (error) {
            console.error(error);
            if (lang !== 'en') await this.loadLanguage('en');
        }
    }
    async setLanguage(lang) {
        await this.loadLanguage(lang);
        localStorage.setItem('cute-lang', lang);
        window.location.reload();
    }
    t(key, fallback, ...args) {
        let translation = this.translations[key] || fallback || key;
        if (typeof translation !== 'string') {
            return translation; // It might be an object for nested translations
        }

        // Handle placeholders like {0}, {1}, etc.
        if (args.length > 0) {
            translation = translation.replace(/{(\d+)}/g, (match, number) => {
                return typeof args[number] !== 'undefined'
                    ? args[number]
                    : match;
            });
        }

        return translation;
    }
}

export default new LocalizationService();