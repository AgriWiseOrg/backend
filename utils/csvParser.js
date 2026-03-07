const fs = require('fs');
const path = require('path');

const parseCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                return reject(err);
            }

            const rows = [];
            let headers = [];
            const lines = data.split(/\r?\n/); // Handle both \r\n and \n

            if (lines.length === 0) {
                return resolve([]);
            }

            // Parse headers
            headers = parseLine(lines[0]);

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const values = parseLine(line);
                if (values.length === headers.length) {
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header.trim()] = values[index].trim();
                    });
                    rows.push(row);
                }
            }

            resolve(rows);
        });
    });
};

// Helper to handle quoted fields containing commas
const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
};

module.exports = parseCSV;
