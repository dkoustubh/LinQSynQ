#!/usr/bin/env node

/**
 * PLC Connection Tester
 * Tests different rack/slot combinations to find the correct configuration
 */

const nodes7 = require('nodes7');

const PLC_IP = '192.168.103.24';
const TIMEOUT = 3000; // 3 seconds per attempt

// Common rack/slot combinations for Siemens PLCs
const configurations = [
    { rack: 0, slot: 1, desc: 'S7-1500 Standard' },
    { rack: 0, slot: 0, desc: 'Alternative Slot 0' },
    { rack: 0, slot: 2, desc: 'S7-1500 with Additional Modules' },
    { rack: 1, slot: 1, desc: 'Alternative Rack 1' },
];

console.log('🔍 PLC Connection Tester');
console.log('='.repeat(60));
console.log(`Testing connection to: ${PLC_IP}`);
console.log('='.repeat(60));
console.log('');

async function testConnection(config) {
    return new Promise((resolve) => {
        const conn = new nodes7();

        const connectionParams = {
            host: PLC_IP,
            rack: config.rack,
            slot: config.slot,
            port: 102,
            timeout: TIMEOUT
        };

        console.log(`Testing Rack ${config.rack}, Slot ${config.slot} (${config.desc})...`);

        const timeoutId = setTimeout(() => {
            conn.dropConnection();
            resolve({ success: false, error: 'Timeout' });
        }, TIMEOUT);

        conn.initiateConnection(connectionParams, (err) => {
            clearTimeout(timeoutId);

            if (err) {
                console.log(`  ❌ Failed: ${err.toString()}`);
                conn.dropConnection();
                resolve({ success: false, error: err.toString() });
            } else {
                console.log(`  ✅ SUCCESS! Connection established.`);

                // Try to add a simple variable and read it
                conn.setTranslationCB((tag) => {
                    if (tag === 'TEST') return 'DB1,INT0';
                    return null;
                });
                conn.addItems(['TEST']);

                conn.readAllItems((readErr, values) => {
                    if (readErr) {
                        console.log(`  ⚠️  Connected but read failed: ${readErr.toString()}`);
                        console.log(`     (This may be due to PUT/GET not enabled or DB1 not existing)`);
                    } else {
                        console.log(`  🎉 Connected AND read data: ${JSON.stringify(values)}`);
                    }

                    conn.dropConnection();
                    resolve({
                        success: true,
                        config: config,
                        canRead: !readErr,
                        values: values
                    });
                });
            }
        });
    });
}

async function runTests() {
    const results = [];

    for (const config of configurations) {
        const result = await testConnection(config);
        results.push({ ...config, ...result });
        console.log('');

        // If we found a working configuration, we can stop
        if (result.success && result.canRead) {
            console.log('🎉 Found working configuration!');
            break;
        }

        // Small delay between attempts
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));

    const successful = results.filter(r => r.success);

    if (successful.length === 0) {
        console.log('❌ No successful connections found.');
        console.log('');
        console.log('Possible reasons:');
        console.log('1. PUT/GET communication is not enabled in TIA Portal');
        console.log('2. PLC is in STOP mode');
        console.log('3. Security settings block external access');
        console.log('4. Wrong PLC model (not S7-1200/1500)');
        console.log('');
        console.log('👉 Check DIAGNOSTICS.md for detailed troubleshooting steps');
    } else {
        console.log(`✅ Found ${successful.length} working configuration(s):`);
        console.log('');
        successful.forEach((r, index) => {
            console.log(`${index + 1}. Rack ${r.rack}, Slot ${r.slot} - ${r.desc}`);
            if (r.canRead) {
                console.log(`   ✅ Can read data: ${JSON.stringify(r.values)}`);
            } else {
                console.log(`   ⚠️  Connected but cannot read (PUT/GET may not be enabled)`);
            }
        });
        console.log('');
        console.log('📝 Recommended Configuration:');
        const best = successful.find(r => r.canRead) || successful[0];
        console.log(`   Rack: ${best.rack}`);
        console.log(`   Slot: ${best.slot}`);
        console.log('');
        console.log('Update plc.js with these values!');
    }

    console.log('='.repeat(60));
    process.exit(0);
}

// Run the tests
runTests().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
