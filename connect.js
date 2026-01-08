const nodes7 = require('nodes7');
const conn = new nodes7();

// PLC Configuration
// REPLACE these values with your actual PLC details
const PLC_IP = '192.168.0.1'; // Default IP, change this
const PLC_RACK = 0;           // Default Rack for S7-1500 is usually 0
const PLC_SLOT = 1;           // Default Slot for S7-1500 is usually 1

// Connection variables
const variables = {
    TEST_VAR: 'DB1,INT0'      // Example: Read Integer from DB1 at offset 0
};

console.log(`Attempting to connect to PLC at ${PLC_IP} (Rack: ${PLC_RACK}, Slot: ${PLC_SLOT})...`);

conn.initiateConnection({port: 102, host: PLC_IP, rack: PLC_RACK, slot: PLC_SLOT}, connected);

function connected(err) {
    if (err) {
        console.error('❌ Connection Failed:', err);
        console.log('\n--- TROUBLESHOOTING ---');
        console.log('1. Check IP address, Rack, and Slot.');
        console.log('2. Ensure TIA Portal "Protection" settings allow PUT/GET communication.');
        console.log('3. Ensure the Data Block (DB) is NOT "Optimized Block Access".');
        process.exit(1);
    }
    
    console.log('✅ Connected to PLC!');
    
    conn.setTranslationCB(tag => variables[tag]);
    conn.addItems(['TEST_VAR']);
    
    conn.readAllItems(valuesReady);
}

function valuesReady(anythingBad, values) {
    if (anythingBad) { 
        console.error("❌ Error reading values:", anythingBad); 
    } else {
        console.log("✅ Read successful!");
        console.log("Values:", values);
    }
    
    // Close connection
    conn.dropConnection(() => {
        console.log("Connection closed.");
        process.exit(0);
    });
}
