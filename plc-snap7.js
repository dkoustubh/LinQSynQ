const nodes7 = require('nodes7');

class Snap7Service {
    constructor() {
        this.conn = new nodes7();
        this.connected = false;
        this.values = {};
        this.tags = {};
        this.pollingInterval = null;

        this.config = {
            host: '192.168.103.24',
            port: 102,
            rack: 0,
            slot: 1
        };
    }

    async connect(ip = null) {
        if (ip) {
            // Handle IP formats like "192.168.1.1" or "192.168.1.1:102"
            const parts = ip.split(':');
            this.config.host = parts[0];
            if (parts[1]) this.config.port = parseInt(parts[1]);
        }

        return new Promise((resolve, reject) => {
            console.log(`\n🔌 Connecting to S7 PLC via Snap7: ${this.config.host} (Rack=${this.config.rack}, Slot=${this.config.slot})`);

            this.conn.initiateConnection({
                port: this.config.port,
                host: this.config.host,
                rack: this.config.rack,
                slot: this.config.slot
            }, (err) => {
                if (err) {
                    console.error('❌ Snap7 Connection Failed:', err);
                    this.connected = false;
                    resolve(false);
                } else {
                    console.log('✅ Snap7 Connected Successfully!');
                    this.connected = true;
                    this.startPolling();
                    resolve(true);
                }
            });
        });
    }

    async disconnect() {
        return new Promise((resolve) => {
            if (this.pollingInterval) clearInterval(this.pollingInterval);
            this.conn.dropConnection(() => {
                this.connected = false;
                console.log('🔌 Snap7 Disconnected');
                resolve();
            });
        });
    }

    updateTags(newTags) {
        // nodes7 expects tags in setTranslationCB or addItems
        // Format: { name: "DB1,INT0" }
        this.tags = { ...this.tags, ...newTags };

        // Filter out OPC UA style tags (ns=...) to avoid errors
        const s7Tags = {};
        for (const [key, val] of Object.entries(this.tags)) {
            // Initialize value if not present so it shows up in UI
            if (this.values[key] === undefined) {
                this.values[key] = 'WAITING...';
            }

            // Simple heuristic: S7 tags usually start with DB, M, I, Q
            // OPC UA tags start with ns=
            if (val && !val.toString().startsWith('ns=')) {
                s7Tags[key] = val;
            } else {
                // Mark as invalid format for this protocol so user knows to update it
                this.values[key] = 'INVALID_FMT';
            }
        }

        if (Object.keys(s7Tags).length > 0) {
            this.conn.setTranslationCB((tag) => s7Tags[tag]);
            this.conn.addItems(Object.keys(s7Tags));
            console.log('Updated Snap7 Tags:', Object.keys(s7Tags));
        }
    }

    removeTag(name) {
        if (this.tags[name]) {
            delete this.tags[name];
            this.conn.removeItems(name);
        }
    }

    startPolling() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        this.pollingInterval = setInterval(() => {
            if (this.connected) {
                this.conn.readAllItems((err, values) => {
                    if (err) {
                        console.error('Error reading S7 tags:', err);
                    } else {
                        this.values = values;
                    }
                });
            }
        }, 1000);
    }

    async writeData(tagName, value) {
        return new Promise((resolve, reject) => {
            if (!this.connected) return reject(new Error('Not connected'));

            // nodes7 writeItems(tag, value, cb)
            this.conn.writeItems(tagName, value, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`📝 Wrote ${value} to ${tagName}`);
                    resolve({ success: true });
                }
            });
        });
    }

    getConnectionInfo() {
        return {
            protocol: 'Snap7',
            ip: this.config.host,
            rack: this.config.rack,
            slot: this.config.slot,
            connected: this.connected
        };
    }
}

module.exports = new Snap7Service();
