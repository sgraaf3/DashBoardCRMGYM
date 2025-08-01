const fs = require('fs').promises;
const path = require('path');

const dbPath = path.join(__dirname, 'MYDB.json');

/**
 * Recursively searches for all objects with a specific name property.
 * The search is case-insensitive.
 * @param {any} data The data to search through (object or array).
 * @param {string} nameToFind The name to search for.
 * @param {object[]} results An array to accumulate the matching objects.
 */
function findAllItemsByName(data, nameToFind, results) {
    const lowerCaseNameToFind = nameToFind.toLowerCase();

    // Case 1: The current data is an object
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        // Check if this object is a match
        if (data.name && typeof data.name === 'string' && data.name.toLowerCase() === lowerCaseNameToFind) {
            results.push(data);
        }
        // Always recurse into its values to find nested matches
        for (const key in data) {
            findAllItemsByName(data[key], nameToFind, results);
        }
    }
    // Case 2: The current data is an array
    else if (Array.isArray(data)) {
        // Recurse into each item in the array
        for (const item of data) {
            findAllItemsByName(item, nameToFind, results);
        }
    }
}

/**
 * Main function to execute the query from command-line arguments.
 */
async function query() {
    const searchTerm = process.argv[2];
    if (!searchTerm) {
        console.error('❌ Error: Please provide a search term.\n   Usage: node query.js "Item Name"');
        return;
    }

    console.log(`🔍 Searching for all instances of "${searchTerm}"...`);

    try {
        const dbContent = await fs.readFile(dbPath, 'utf8');
        const database = JSON.parse(dbContent);
        const results = [];
        findAllItemsByName(database, searchTerm, results);

        if (results.length > 0) {
            console.log(`✅ Found ${results.length} match(es):`);
            results.forEach((result, index) => {
                console.log(`\n--- Match ${index + 1} ---`);
                console.log(JSON.stringify(result, null, 2));
            });
        } else {
            console.log('🤷 No match found.');
        }
    } catch (error) {
        console.error(`❌ An error occurred: ${error.message}`);
    }
}

query();