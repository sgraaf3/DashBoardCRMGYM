/**
 * @module FileService
 * @description A centralized service for handling file-related operations like reading and picking files.
 */
class FileService {
    /**
     * Reads a file and returns its content as a text string.
     * @param {File} file - The file object to read.
     * @returns {Promise<string>} A promise that resolves with the file content as text.
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    /**
     * Programmatically opens the OS file picker.
     * @param {object} options - Configuration for the file picker.
     * @param {string} [options.accept='*'] - The `accept` attribute for the file input (e.g., '.txt, .csv').
     * @param {boolean} [options.multiple=false] - Whether to allow multiple file selection.
     * @returns {Promise<FileList|null>} A promise that resolves with the selected FileList or null if canceled.
     */
    openFilePicker({ accept = '*', multiple = false } = {}) {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = accept;
            input.multiple = multiple;

            input.onchange = e => {
                resolve(e.target.files);
            };

            const onFocus = () => {
                window.removeEventListener('focus', onFocus);
                setTimeout(() => {
                    if (input.files.length === 0) resolve(null);
                }, 300);
            };
            window.addEventListener('focus', onFocus);

            input.click();
        });
    }
}

const fileService = new FileService();
export default fileService;