const fs = require('fs');
const path = require('path');

const TAGS_FILE = path.join(__dirname, 'tags.json');

class TagManager {
    constructor() {
        this.tags = {};
        this.loadTags();
    }

    loadTags() {
        try {
            if (fs.existsSync(TAGS_FILE)) {
                const data = fs.readFileSync(TAGS_FILE, 'utf8');
                this.tags = JSON.parse(data);
                console.log('✅ Loaded tags from disk:', Object.keys(this.tags).length);
            } else {
                // Default tags if no file exists
                this.tags = {
                    TEST_TAG: 'DB1,INT0'
                };
                this.saveTags();
            }
        } catch (err) {
            console.error('❌ Error loading tags:', err);
            this.tags = {};
        }
    }

    saveTags() {
        try {
            fs.writeFileSync(TAGS_FILE, JSON.stringify(this.tags, null, 2));
            console.log('💾 Tags saved to disk.');
        } catch (err) {
            console.error('❌ Error saving tags:', err);
        }
    }

    getTags() {
        return this.tags;
    }

    addTag(name, address) {
        this.tags[name] = address;
        this.saveTags();
        return this.tags;
    }

    removeTag(name) {
        if (this.tags[name]) {
            delete this.tags[name];
            this.saveTags();
        }
        return this.tags;
    }
}

module.exports = new TagManager();
