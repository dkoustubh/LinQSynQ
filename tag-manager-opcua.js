const fs = require('fs');
const path = require('path');

class OPCUATagManager {
    constructor() {
        this.baseTagsFile = path.join(__dirname, 'tags-opcua.json');
        this.newTagsFile = path.join(__dirname, 'tags-new.json');
        this.baseTags = this.loadBaseTags();
        this.newTags = this.loadNewTags();
    }

    loadBaseTags() {
        // Default tags for Snap7 S7-1500
        const defaultTags = {
            'Machine_Speed': 'DB1,INT0',
            'Temperature': 'DB1,REAL4',
            'Running': 'DB1,X8.0',
            'Fault_Code': 'DB1,INT10'
        };

        try {
            if (fs.existsSync(this.baseTagsFile)) {
                const tags = JSON.parse(fs.readFileSync(this.baseTagsFile, 'utf8'));
                // Merge or default if empty
                return Object.keys(tags).length > 0 ? tags : defaultTags;
            }
        } catch (err) {
            console.error('Error loading Base OPC UA tags:', err);
        }
        return defaultTags;
    }

    loadNewTags() {
        try {
            if (fs.existsSync(this.newTagsFile)) {
                return JSON.parse(fs.readFileSync(this.newTagsFile, 'utf8'));
            }
        } catch (err) {
            console.error('Error loading New OPC UA tags:', err);
        }
        return {};
    }

    saveNewTags() {
        try {
            fs.writeFileSync(this.newTagsFile, JSON.stringify(this.newTags, null, 2));
        } catch (err) {
            console.error('Error saving New OPC UA tags:', err);
        }
    }

    getTags() {
        // Merge base and new tags
        return { ...this.baseTags, ...this.newTags };
    }

    addTag(name, nodeId) {
        this.newTags[name] = nodeId;
        this.saveNewTags();
        return this.getTags();
    }

    removeTag(name) {
        // Only allow removing from new tags file to preserve history
        if (this.newTags[name]) {
            delete this.newTags[name];
            this.saveNewTags();
        } else if (this.baseTags[name]) {
            console.warn(`Attempted to delete base tag '${name}'. Base tags are read-only.`);
            // Optional: Implement a 'deleted-tags.json' masking strategy if needed, 
            // but for now we strictly follow "adding new to new file".
        }
        return this.getTags();
    }

    updateTag(name, nodeId) {
        // If it's in new tags, update it there. 
        // If it's in base tags, we arguably shouldn't touch it or we 'promote' it to new tags as an override.
        // Let's implement override behavior: any update saves to new tags.
        this.newTags[name] = nodeId;
        this.saveNewTags();
        return this.getTags();
    }
}

module.exports = new OPCUATagManager();
