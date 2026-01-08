const nodes7 = require('nodes7');

class PLCService {
    constructor() {
        this.conn = new nodes7();
        this.connected = false;
        this.values = {};
        this.config = {
            host: '192.168.103.24', // Updated to match running PLC
            rack: 0,
            slot: 1,
            port: 102
        };
        this.variables = {
            // Define your tags here based on PLC configuration
            // Format: NAME: 'ADDRESS'
            // Note: Mapping OPC UA node IDs to S7 addresses
            // Update these addresses based on your actual DB structure
            TEST_TAG: 'DB1,INT0',
            PRODUCTION_DATA: 'DB2,INT0',
            MACHINE_STATUS: 'DB2,INT10',
            PROCESS_VALUES: 'DB2,REAL20'
        };
    }

    connect(ip, rack = 0, slot = 1) {
        if (ip) this.config.host = ip;
        if (rack !== undefined) this.config.rack = rack;
        if (slot !== undefined) this.config.slot = slot;

        console.log(`Connecting to PLC at ${this.config.host}...`);

        return new Promise((resolve, reject) => {
            this.conn.initiateConnection(this.config, (err) => {
                if (err) {
                    console.error('PLC Connection Failed:', err);
                    this.connected = false;
                    // reject(err); // Don't reject, just log, so server keeps running
                    resolve(false);
                } else {
                    console.log('PLC Connected Successfully!');
                    this.connected = true;
                    this.setupTranslation();
                    resolve(true);
                }
            });
        });
    }

    setupTranslation() {
        this.conn.setTranslationCB((tag) => this.variables[tag]);
        this.conn.addItems(Object.keys(this.variables));
    }

    readData() {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                return resolve(null);
            }
            this.conn.readAllItems((err, values) => {
                if (err) {
                    console.error('Error reading PLC data:', err);
                    // If error implies disconnection, handle it (simplified here)
                    resolve(null);
                } else {
                    this.values = values;
                    resolve(values);
                }
            });
        });
    }

    updateTags(newTags) {
        // newTags is an object { TAG_NAME: 'ADDRESS' }
        this.variables = { ...this.variables, ...newTags };
        if (this.connected) {
            this.conn.dropConnection(() => {
                this.connect(); // Reconnect to apply new items
            });
        }
    }

    writeData(tagName, value) {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                return reject(new Error('PLC not connected'));
            }

            if (!this.variables[tagName]) {
                return reject(new Error(`Tag "${tagName}" not found`));
            }

            // nodes7 writeItems expects: tagName, value, callback
            this.conn.writeItems(tagName, value, (err) => {
                if (err) {
                    console.error(`Error writing to tag "${tagName}":`, err);
                    reject(err);
                } else {
                    console.log(`✅ Successfully wrote value "${value}" to tag "${tagName}"`);
                    resolve({ success: true, tag: tagName, value });
                }
            });
        });
    }
}

module.exports = new PLCService();
