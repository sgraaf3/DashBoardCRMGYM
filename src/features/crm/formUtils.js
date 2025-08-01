/**
 * @module formUtils
 * @description Provides utility functions for handling form submissions.
 */

/**
 * Handles the submission process for a modal form, including data processing,
 * API calls, and user feedback.
 * @param {object} options - The configuration for the form submission.
 * @param {HTMLFormElement} options.formElement - The form being submitted.
 * @param {boolean} options.isEditing - True if editing an existing entity, false if creating.
 * @param {dataStore} options.dataStore - The application's data store instance.
 * @param {uIManager} options.uIManager - The application's UI manager instance.
 * @param {Function} options.onSaveCallback - A callback to run after a successful save.
 * @param {string} options.entityName - The name of the entity (e.g., 'member', 'employee').
 * @param {string} options.addMethod - The name of the method on dataStore to add an entity.
 * @param {string} options.updateMethod - The name of the method on dataStore to update an entity.
 * @param {Function} [options.processData] - An optional function to process form data before saving.
 */
export async function handleFormSubmission(options) {
    const { formElement, isEditing, dataStore, uIManager, onSaveCallback, entityName, addMethod, updateMethod, processData = data => data } = options;

    const formData = new FormData(formElement);
    let data = processData(Object.fromEntries(formData.entries()));

    try {
        const promise = isEditing ? dataStore[updateMethod](parseInt(data.id), data) : dataStore[addMethod](data);
        await promise;
        uIManager.showMessage(`${entityName} ${isEditing ? 'updated' : 'created'} successfully!`, 'success');
        uIManager.hideModal();
        if (onSaveCallback) onSaveCallback();
    } catch (error) {
        console.error(`Failed to save ${entityName.toLowerCase()}:`, error);
        uIManager.showMessage(`Failed to save ${entityName.toLowerCase()}. See console for details.`, 'error');
    }
}