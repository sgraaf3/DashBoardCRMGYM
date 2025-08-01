class BaseListView {
    constructor(app) {
        if (this.constructor === BaseListView) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        this.app = app;
    }

    async render(container) {
        this.container = container; // Store container for re-rendering
        const entityName = this._getEntityName();
        container.innerHTML = `<h2>Loading ${entityName}...</h2>`;
        try {
            const items = await this.app.dataStore[this._getFetchMethodName()]();
            container.innerHTML = this._renderList(items);
            this._setupEventListeners(container);
        } catch (error) {
            console.error(`Failed to render ${entityName} list:`, error);
            container.innerHTML = `<h2>Error loading ${entityName}</h2>`;
        }
    }

    _addBaseEventListeners(container) {
        container.querySelector(`#${this._getAddButtonId()}`)?.addEventListener('click', () => {
            this._getModalShowMethod()(this.app, () => this.render(this.container));
        });
    }

    _setupEventListeners(container) {
        this._addBaseEventListeners(container);
    }

    // Abstract methods to be implemented by subclasses
    _getEntityName() { throw new Error("Must implement _getEntityName"); }
    _getSingularEntityName() { throw new Error("Must implement _getSingularEntityName"); }
    _getFetchMethodName() { throw new Error("Must implement _getFetchMethodName"); }
    _getAddButtonId() { throw new Error("Must implement _getAddButtonId"); }
    _getModalShowMethod() { throw new Error("Must implement _getModalShowMethod"); }
    _renderList(items) { throw new Error("Must implement _renderList"); }
}

export default BaseListView;