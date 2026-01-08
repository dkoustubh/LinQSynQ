#!/usr/bin/env node

/**
 * FuseFlow Write Test Script
 * 
 * This script demonstrates how to programmatically write values to PLC tags
 * using the FuseFlow REST API.
 * 
 * Usage:
 *   node write-test.js <tagName> <value>
 * 
 * Example:
 *   node write-test.js TEST_TAG 456
 */

const axios = require('axios');

const FUSEFLOW_API = 'http://localhost:3001';

async function writeTag(tagName, value) {
    console.log(`\n🔧 FuseFlow Write Test`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Tag Name: ${tagName}`);
    console.log(`Value:    ${value}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    try {
        // First, check if server is running
        console.log('📡 Checking server status...');
        const statusResponse = await axios.get(`${FUSEFLOW_API}/api/status`);

        if (!statusResponse.data.connected) {
            console.error('❌ PLC is not connected!');
            console.log('💡 Please connect to PLC from the web interface first.');
            process.exit(1);
        }

        console.log('✅ PLC is connected');

        // Check if tag exists
        const tags = statusResponse.data.tags;
        if (!tags[tagName]) {
            console.error(`❌ Tag "${tagName}" not found!`);
            console.log('📋 Available tags:', Object.keys(tags).join(', '));
            process.exit(1);
        }

        console.log(`✅ Tag "${tagName}" found`);
        console.log(`📊 Current value: ${tags[tagName]}`);

        // Perform write
        console.log(`\n🚀 Writing new value...`);
        const writeResponse = await axios.post(`${FUSEFLOW_API}/api/write`, {
            tagName: tagName,
            value: parseFloat(value) || value
        });

        if (writeResponse.data.success) {
            console.log(`\n✅ SUCCESS!`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`Value "${value}" written to tag "${tagName}"`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

            // Wait and verify
            console.log('⏳ Waiting 2 seconds for PLC to update...\n');
            await new Promise(resolve => setTimeout(resolve, 2000));

            const verifyResponse = await axios.get(`${FUSEFLOW_API}/api/status`);
            const newValue = verifyResponse.data.tags[tagName];
            console.log(`📊 Verified value: ${newValue}`);

            if (newValue == value) {
                console.log('✅ Write verified successfully!\n');
            } else {
                console.log('⚠️  Value mismatch - PLC may need more time to update\n');
            }
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.response?.data?.message || error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Is FuseFlow server running?');
            console.log('   Try: npm run dev\n');
        }

        process.exit(1);
    }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
    console.log('\n📖 Usage: node write-test.js <tagName> <value>\n');
    console.log('Examples:');
    console.log('  node write-test.js TEST_TAG 100');
    console.log('  node write-test.js TEMPERATURE 25.5');
    console.log('  node write-test.js IS_RUNNING 1\n');
    process.exit(1);
}

const [tagName, value] = args;
writeTag(tagName, value);
