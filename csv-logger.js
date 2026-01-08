const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');

const LOG_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR);
}

const LOG_FILE = path.join(LOG_DIR, 'data_log.csv');

class CsvLogger {
    constructor() {
        this.writer = null;
        this.currentHeaders = [];
    }

    init(tags) {
        // Re-initialize writer if tags change to update headers
        const headers = [
            { id: 'timestamp', title: 'TIMESTAMP' },
            ...Object.keys(tags).map(tag => ({ id: tag, title: tag }))
        ];

        // Check if headers changed
        const headerKeys = headers.map(h => h.id).join(',');
        if (this.currentHeaders !== headerKeys) {
            this.currentHeaders = headerKeys;

            // Note: csv-writer appends by default, but if headers change, 
            // the CSV structure might get messy. For simplicity, we just append.
            // In a real app, you might start a new file or handle schema changes.

            this.writer = createCsvWriter({
                path: LOG_FILE,
                header: headers,
                append: true
            });
            console.log('📝 CSV Logger initialized with tags:', Object.keys(tags));
        }
    }

    log(data) {
        if (!this.writer) return;

        const record = {
            timestamp: new Date().toISOString(),
            ...data
        };

        this.writer.writeRecords([record])
            .then(() => {
                // console.log('Logged to CSV');
            })
            .catch(err => console.error('❌ CSV Write Error:', err));
    }
}

module.exports = new CsvLogger();
