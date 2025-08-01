/**
 * @module ObjectUtils
 * @description Utilities for working with JavaScript objects.
 */

/**
 * Converts form data into a plain JavaScript object.
 * @param {FormData} formData - The FormData object to convert.
 * @returns {Object} A plain object representation of the form data.
 */
export function formDataToObject(formData) {
    const object = {};
    formData.forEach((value, key) => {
        // A simple implementation that doesn't handle multiple values for the same key
        object[key] = value;
    });
    return object;
}