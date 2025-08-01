const fs = require('fs').promises;
const path = require('path');

// --- Configuration ---
// The root directory you want to start scanning from.
// Using '.' means the script will scan the directory it is located in.
const ROOT_DIRECTORY = '.';

// The name of the output JSON file.
const OUTPUT_FILE = 'file_index.json';

// Optional: An array of directories or files to ignore.
const IGNORE_LIST = ['node_modules', '.git', OUTPUT_FILE, path.basename(__filename)];

/**
 * Recursively scans a directory and builds a tree structure of its contents.
 * @param {string} dirPath The path to the directory to scan.
 * @returns {Promise<Array>} A promise that resolves to an array of file/directory objects.
 */
async function buildFileTree(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const children = [];

    for (const entry of entries) {
        if (IGNORE_LIST.includes(entry.name)) {
            continue;
        }

        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            children.push({
                name: entry.name,
                type: 'directory',
                path: fullPath,
                children: await buildFileTree(fullPath),
            });
        } else if (entry.isFile()) {
            children.push({
                name: entry.name,
                type: 'file',
                path: fullPath,
            });
        }
    }
    // Sort children to have directories first, then files, both alphabetically.
    return children.sort((a, b) => {
        if (a.type === b.type) {
            return a.name.localeCompare(b.name);
        }
        return a.type === 'directory' ? -1 : 1;
    });
}

/**
 * Main function to generate and write the file index.
 */
async function main() {
    console.log(`Starting scan of '${path.resolve(ROOT_DIRECTORY)}'...`);
    try {
        const tree = await buildFileTree(ROOT_DIRECTORY);
        
        const outputPath = path.join(ROOT_DIRECTORY, OUTPUT_FILE);
        await fs.writeFile(outputPath, JSON.stringify(tree, null, 2));
        console.log(`✅ Success! Index created at '${outputPath}'`);
    } catch (error) {
        console.error('❌ An error occurred while generating the file index:', error);
    }
}

main();