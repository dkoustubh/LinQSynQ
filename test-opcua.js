#!/usr/bin/env node

/**
 * OPC UA Connection Tester
 * Tests connection to OPC UA server and browses available nodes
 */

const {
    OPCUAClient,
    MessageSecurityMode,
    SecurityPolicy,
    AttributeIds
} = require("node-opcua-client");

const ENDPOINT_URL = 'opc.tcp://192.168.103.24:4840';

console.log('🔍 FuseFlow OPC UA Connection Tester');
console.log('═'.repeat(60));
console.log(`Testing connection to: ${ENDPOINT_URL}`);
console.log('═'.repeat(60));
console.log('');

async function testConnection() {
    let client;
    let session;

    try {
        console.log('Step 1: Creating OPC UA Client...');
        client = OPCUAClient.create({
            applicationName: "FuseFlow Test Client",
            connectionStrategy: {
                initialDelay: 1000,
                maxRetry: 1
            },
            securityMode: MessageSecurityMode.None,
            securityPolicy: SecurityPolicy.None,
            endpointMustExist: false
        });
        console.log('  ✅ Client created');

        console.log('\nStep 2: Connecting to server...');
        await client.connect(ENDPOINT_URL);
        console.log('  ✅ Connected to OPC UA server');

        console.log('\nStep 3: Creating session...');
        session = await client.createSession();
        console.log('  ✅ Session created');

        console.log('\n' + '═'.repeat(60));
        console.log('🎉 CONNECTION SUCCESSFUL!');
        console.log('═'.repeat(60));

        // Test reading some tags
        console.log('\n📖 Testing Tag Reads:');
        console.log('─'.repeat(60));

        const testTags = [
            { name: 'Tag1', nodeId: 'ns=0;i=2253' },
            { name: 'Tag2', nodeId: 'ns=2;i=5001' },
            { name: 'PLC', nodeId: 'ns=3;s=PLC' },
            { name: 'STKR1_HeartBit', nodeId: 'ns=3;s="PLC_To_WMS"."STKR1_Heart Bit"' }
        ];

        for (const tag of testTags) {
            try {
                console.log(`\nReading: ${tag.name} (${tag.nodeId})`);
                const dataValue = await session.read({
                    nodeId: tag.nodeId,
                    attributeId: AttributeIds.Value
                });

                if (dataValue.statusCode.isGood()) {
                    console.log(`  ✅ Value: ${dataValue.value.value}`);
                    console.log(`     Type: ${dataValue.value.dataType}`);
                    console.log(`     Quality: ${dataValue.statusCode.name}`);
                    console.log(`     Timestamp: ${dataValue.sourceTimestamp}`);
                } else {
                    console.log(`  ⚠️  Status: ${dataValue.statusCode.name}`);
                    console.log(`     (Node may not exist or access denied)`);
                }
            } catch (err) {
                console.log(`  ❌ Error: ${err.message}`);
            }
        }

        console.log('\n' + '═'.repeat(60));
        console.log('📊 SUMMARY');
        console.log('═'.repeat(60));
        console.log('✅ Server Connection:     SUCCESS');
        console.log('✅ Session Creation:      SUCCESS');
        console.log('✅ Tag Reading:           See results above');
        console.log('');
        console.log('🎯 NEXT STEPS:');
        console.log('   1. Start FuseFlow with OPC UA:');
        console.log('      npm run dev:opcua');
        console.log('');
        console.log('   2. Open Dashboard:');
        console.log('      http://localhost:5173');
        console.log('');
        console.log('   3. Tags to add in UI:');
        for (const tag of testTags) {
            console.log(`      - Name: ${tag.name}, NodeId: ${tag.nodeId}`);
        }
        console.log('═'.repeat(60));

    } catch (err) {
        console.log('\n' + '═'.repeat(60));
        console.log('❌ CONNECTION FAILED');
        console.log('═'.repeat(60));
        console.log(`Error: ${err.message}`);
        console.log('');
        console.log('Possible causes:');
        console.log('  1. OPC UA server is not running on the PLC');
        console.log('  2. Wrong endpoint URL');
        console.log('  3. Network issues');
        console.log('  4. Security settings block anonymous access');
        console.log('');
        console.log('Troubleshooting:');
        console.log('  1. Check if port 4840 is accessible:');
        console.log('     nc -zv 192.168.103.24 4840');
        console.log('  2. Verify OPC UA server is enabled in TIA Portal');
        console.log('  3. Check PLC firewall settings');
        console.log('═'.repeat(60));
        process.exit(1);
    } finally {
        // Cleanup
        if (session) {
            await session.close();
        }
        if (client) {
            await client.disconnect();
        }
    }

    process.exit(0);
}

// Run the test
testConnection().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
