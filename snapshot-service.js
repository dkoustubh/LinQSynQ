const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, 'backups');

const startSnapshotService = () => {
    if (!fs.existsSync(BACKUP_DIR)) {
        try {
            fs.mkdirSync(BACKUP_DIR);
            console.log('📁 Created backups directory');
        } catch (e) {
            console.error('Failed to create backup dir:', e);
        }
    }

    // Run every hour
    setInterval(() => {
        try {
            const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
            const sources = ['tags-new.json', 'tags-opcua.json'];

            sources.forEach(file => {
                const srcPath = path.join(__dirname, file);
                if (fs.existsSync(srcPath)) {
                    const destPath = path.join(BACKUP_DIR, `${file.replace('.json', '')}-${timestamp}.json`);
                    fs.copyFileSync(srcPath, destPath);
                    console.log(`[Snapshot] Saved ${destPath}`);
                }
            });

            // Clean up old backups (> 7 days)? Maybe later.
        } catch (err) {
            console.error('[Snapshot] Failed:', err);
        }
    }, 60 * 60 * 1000);

    console.log('⏰ Snapshot Service Started (1 hr interval)');
};

module.exports = startSnapshotService;
