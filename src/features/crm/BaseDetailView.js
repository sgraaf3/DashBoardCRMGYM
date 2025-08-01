class BaseDetailView {
    constructor(app) {
        if (this.constructor === BaseDetailView) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        this.app = app;
    }

    async render(container, entityId) {
        container.innerHTML = `<h2>Loading...</h2>`;
        try {
            const entity = await this.app.dataStore[this._getFetchMethodName()](entityId);
            if (!entity) {
                container.innerHTML = `<h2>${this._getSingularEntityName()} Not Found</h2>`;
                return;
            }
            container.innerHTML = this._renderContent(entity);
            this.attachEventListeners(container, entityId, entity);
        } catch (error) {
            console.error(`Failed to render detail for ${entityId}:`, error);
            container.innerHTML = `<h2>Error loading details.</h2>`;
        }
    }

    attachEventListeners(container, entityId, entity) {
        container.querySelector(`#${this._getEditButtonId()}`)?.addEventListener('click', () => {
            this._getModalShowMethod()(this.app, entity, () => this.render(container, entityId));
        });

        container.querySelector(`#${this._getDeleteButtonId()}`)?.addEventListener('click', async () => {
            const confirmed = await this.app.uiManager.showConfirmation(`Delete ${this._getSingularEntityName()}`, `Are you sure? This cannot be undone.`);
            if (confirmed) {
                await this.app.dataStore[this._getDeleteMethodName()](entityId);
                this.app.uiManager.showNotification(`${this._getSingularEntityName()} deleted.`, 'success');
                window.location.hash = '#/crm';
            }
        });
    }

    _getSingularEntityName() { throw new Error("Must implement _getSingularEntityName"); }
    _getFetchMethodName() { throw new Error("Must implement _getFetchMethodName"); }
    _getEditButtonId() { throw new Error("Must implement _getEditButtonId"); }
    _getDeleteButtonId() { throw new Error("Must implement _getDeleteButtonId"); }
    _getDeleteMethodName() { throw new Error("Must implement _getDeleteMethodName"); }
    _getModalShowMethod() { throw new Error("Must implement _getModalShowMethod"); }
    _renderContent(entity) { throw new Error("Must implement _renderContent"); }
}

export default BaseDetailView;