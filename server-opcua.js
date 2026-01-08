const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const plcOpcua = require('./plc-opcua');
const plcSnap7 = require('./plc-snap7'); // Import Snap7 driver
const mqttService = require('./mqtt-client');
const tagManagerOpcua = require('./tag-manager-opcua');
const csvLogger = require('./csv-logger');
const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, 'users.json');
const AUDIT_FILE = path.join(__dirname, 'audit-log.json');
const METADATA_FILE = path.join(__dirname, 'tag-metadata.json');

const connectDB = require('./db');
const User = require('./models/User');
const AuditLog = require('./models/AuditLog');
const TagMetadata = require('./models/TagMetadata');

// Connect Database
connectDB();

// --- Migration & Helper Functions ---
const migrateData = async () => {
    try {
        const usersCount = await User.countDocuments();
        if (usersCount === 0 && fs.existsSync(USERS_FILE)) {
            const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
            for (const u of users) {
                // Default permissions based on role
                const permissions = u.role === 'admin'
                    ? ['read_tag', 'write_tag', 'add_tag', 'delete_tag', 'manage_users']
                    : ['read_tag', 'write_tag'];

                await User.create({ ...u, permissions });
            }
            console.log('✅ Migrated Users to MongoDB');
        } else if (usersCount === 0) {
            // Create default admin if no file and no db
            await User.create({
                username: 'admin',
                password: 'password123',
                role: 'admin',
                permissions: ['read_tag', 'write_tag', 'add_tag', 'delete_tag', 'manage_users']
            });
            console.log('✅ Created Default Admin User');
        }

        const tagsCount = await TagMetadata.countDocuments();
        if (tagsCount === 0 && fs.existsSync(METADATA_FILE)) {
            const meta = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
            for (const [name, data] of Object.entries(meta)) {
                await TagMetadata.create({ tagName: name, ...data });
            }
            console.log('✅ Migrated Tag Metadata to MongoDB');
        }
    } catch (err) {
        console.error('Migration Error:', err);
    }
};

// Run migration slightly after connection
setTimeout(migrateData, 2000);

const logAudit = async (user, action, details) => {
    try {
        await AuditLog.create({
            user: user || 'Anonymous',
            action,
            details
        });
    } catch (err) {
        console.error('Audit Log Error:', err);
    }
};

const getTagMetadataMap = async () => {
    try {
        const tags = await TagMetadata.find();
        return tags.reduce((acc, tag) => {
            acc[tag.tagName] = {
                address: tag.address,
                owner: tag.owner,
                description: tag.description,
                datatype: tag.datatype,
                createdAt: tag.createdAt
            };
            return acc;
        }, {});
    } catch (err) { return {}; }
};

const updateTagMetadata = async (tagName, metadata) => {
    try {
        if (metadata === null) {
            await TagMetadata.findOneAndDelete({ tagName });
        } else {
            await TagMetadata.findOneAndUpdate(
                { tagName },
                { $set: metadata },
                { upsert: true, new: true }
            );
        }
    } catch (err) {
        console.error('Metadata Update Error:', err);
    }
};

const categorizeTags = async (allTags) => {
    const meta = await getTagMetadataMap();
    const categorized = {
        active: {}, empty: {}, new: {}, old: {}
    };

    const emptyRegex = /^(SPARE|BOOL_|INT_|WORD_|DINT_|REAL_|BYTE_).*/i;

    for (const [name, address] of Object.entries(allTags)) {
        if (meta[name]) {
            categorized.new[name] = { address, ...meta[name] };
        } else if (emptyRegex.test(name)) {
            categorized.empty[name] = address;
        } else {
            categorized.old[name] = address;
        }
        if (!emptyRegex.test(name)) {
            categorized.active[name] = address;
        }
    }
    return categorized;
};

// --- Helper Functions ---




// Initialize modules
let currentPlc = plcOpcua; // Default driver: OPC UA
let currentProtocol = 'OPC UA';

// Initial tag setup
currentPlc.tags = tagManagerOpcua.getTags();
if (currentPlc.updateTags) {
    currentPlc.updateTags(currentPlc.tags);
}
csvLogger.init(currentPlc.tags);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "DELETE"]
    }
});

app.use(cors());
app.use(express.json());

const PORT = 3001;

// API Routes
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (user) {
            res.json({ success: true, user: { username: user.username, role: user.role, permissions: user.permissions } });
            logAudit(user.username, 'LOGIN', 'User logged in');
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Auth Error' });
    }
});

app.get('/api/audit-logs', async (req, res) => {
    try {
        const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
        res.json(logs);
    } catch (err) {
        res.json([]);
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}, '-password'); // Exclude password
        res.json(users);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to load users' });
    }
});

app.post('/api/users', async (req, res) => {
    const { username, password, role, permissions, requestor } = req.body;

    // Check if requestor is admin (Access Matrix Enforcement)
    // Here we rely on the requestor passing their check, but ideally verify again
    // In "Full Fledged" app, use JWT. For now, trusting the frontend + simple check

    try {
        const adminUser = await User.findOne({ username: requestor });
        if (!adminUser || !adminUser.permissions.includes('manage_users')) {
            return res.status(403).json({ success: false, message: 'Permission Denied: manage_users required' });
        }

        if (await User.findOne({ username })) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const newUser = new User({ username, password, role, permissions });
        await newUser.save();

        logAudit(requestor, 'ADD_USER', `Added user: ${username} (${role})`);

        const users = await User.find({}, '-password');
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/users/:username', async (req, res) => {
    const { username } = req.params;
    const requestor = req.query.requestor;

    try {
        const adminUser = await User.findOne({ username: requestor });
        if (!adminUser || !adminUser.permissions.includes('manage_users')) {
            return res.status(403).json({ success: false, message: 'Permission Denied' });
        }

        await User.findOneAndDelete({ username });
        logAudit(requestor, 'DELETE_USER', `Deleted user: ${username}`);

        const users = await User.find({}, '-password');
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
});

app.get('/api/status', async (req, res) => {
    res.json({
        protocol: currentProtocol,
        connected: currentPlc.connected,
        config: currentPlc.config,
        connectionInfo: currentPlc.getConnectionInfo ? currentPlc.getConnectionInfo() : {},
        tags: tagManagerOpcua.getTags(),
        categorizedTags: await categorizeTags(tagManagerOpcua.getTags()),
        mqtt: {
            connected: mqttService.connected,
            config: mqttService.config
        }
    });
});

app.post('/api/connect', async (req, res) => {
    const { endpointUrl, protocol } = req.body;

    console.log(`\n🔄 Connection Request: ${protocol || 'OPC UA'} -> ${endpointUrl}`);

    // 1. Disconnect current driver if connected
    if (currentPlc.connected) {
        await currentPlc.disconnect();
    }

    // 2. Switch Driver based on protocol
    if (protocol && (protocol.includes('Snap7') || protocol.includes('S7'))) {
        currentPlc = plcSnap7;
        currentProtocol = 'Snap7';
        console.log('👉 Switched to Snap7 Driver');
    } else {
        currentPlc = plcOpcua;
        currentProtocol = 'OPC UA';
        console.log('👉 Switched to OPC UA Driver');
    }

    // 3. Sync Tags to new driver
    const tags = tagManagerOpcua.getTags();
    if (currentPlc.updateTags) {
        currentPlc.updateTags(tags);
    } else {
        currentPlc.tags = tags;
    }

    // 4. Connect
    // Snap7 needs IP, OPC UA needs Endpoint URL
    let target = endpointUrl;
    if (currentProtocol === 'Snap7') {
        // Extract IP from "opc.tcp://IP:PORT" or just use as is if it's an IP
        if (endpointUrl.includes('://')) {
            try {
                // Remove protocol prefix
                const clean = endpointUrl.split('://')[1];
                // Get IP part (before :)
                target = clean.split(':')[0];
            } catch (e) {
                target = endpointUrl;
            }
        }
    }

    const success = await currentPlc.connect(target);

    res.json({
        success,
        connected: currentPlc.connected,
        info: currentPlc.getConnectionInfo ? currentPlc.getConnectionInfo() : {}
    });
});

app.post('/api/mqtt/connect', (req, res) => {
    const { brokerUrl, topic } = req.body;
    mqttService.connect(brokerUrl, topic);
    res.json({ success: true });
});

app.post('/api/tags', async (req, res) => {
    const { name, nodeId, datatype, user } = req.body;
    if (name && nodeId) {
        const newTags = tagManagerOpcua.addTag(name, nodeId);

        if (currentPlc.updateTags) {
            currentPlc.updateTags({ [name]: nodeId });
        }

        // Update Metadata (MongoDB)
        await updateTagMetadata(name, {
            address: nodeId,
            datatype: datatype || 'Boolean',
            owner: user ? user.username : 'unknown',
            createdAt: new Date().toISOString()
        });

        // Log Audit (MongoDB)
        await logAudit(user ? user.username : 'system', 'ADD_TAG', `Added tag: ${name} (${nodeId})`);

        csvLogger.init(newTags);
        res.json({ success: true, tags: newTags, categorizedTags: await categorizeTags(newTags) });
    } else {
        res.status(400).json({
            success: false,
            message: 'Name and NodeId required.'
        });
    }
});

app.delete('/api/tags/:name', async (req, res) => {
    const { name } = req.params;
    const user = req.query.user; // Pass user in query param for delete

    const newTags = tagManagerOpcua.removeTag(name);

    if (currentPlc.removeTag) {
        currentPlc.removeTag(name);
    }

    // Clear Metadata
    await updateTagMetadata(name, null);

    // Log Audit
    await logAudit(user || 'system', 'DELETE_TAG', `Deleted tag: ${name}`);

    csvLogger.init(newTags);
    res.json({ success: true, tags: newTags, categorizedTags: await categorizeTags(newTags) });
});

app.post('/api/nodered/sync', async (req, res) => {
    const { ip } = req.body;
    const tags = req.body.tags || tagManagerOpcua.getTags();
    console.log('🔄 Syncing tags to Node-RED...');

    const flowId = 'fuseflow-generated-flow';
    const plcConfigId = 'fuseflow-s7-config';

    // Transform tags to S7 format (simple heuristic)
    const vars = Object.entries(tags)
        .filter(([_, addr]) => !addr.startsWith('ns=')) // Filter out OPC UA tags
        .map(([name, addr]) => ({ name, addr }));

    if (vars.length === 0) {
        return res.json({ success: false, message: 'No valid S7 tags found to sync.' });
    }

    const nodes = [
        {
            id: flowId,
            type: "tab",
            label: "FuseFlow Auto-Gen",
            disabled: false,
            info: "Automatically generated by FuseFlow"
        },
        {
            id: plcConfigId,
            type: "s7 endpoint",
            transport: "iso-on-tcp",
            address: ip || "192.168.103.24",
            port: "102",
            rack: "0",
            slot: "1",
            vartable: vars,
            name: "FuseFlow PLC"
        },
        {
            id: "s7-read-all",
            type: "s7 in",
            z: flowId,
            endpoint: plcConfigId,
            mode: "all",
            variable: "",
            diff: true,
            name: "Read All Tags",
            x: 200,
            y: 200,
            wires: [["debug-node", "mqtt-out-node"]]
        },
        {
            id: "debug-node",
            type: "debug",
            z: flowId,
            name: "Debug Output",
            active: true,
            tosidebar: true,
            console: false,
            tostatus: false,
            complete: "payload",
            targetType: "msg",
            x: 450,
            y: 200,
            wires: []
        },
        {
            id: "mqtt-out-node",
            type: "mqtt out",
            z: flowId,
            name: "To FuseFlow",
            topic: "fuseflow/data",
            qos: "",
            retain: "",
            respTopic: "",
            contentType: "",
            userProps: "",
            correl: "",
            expiry: "",
            broker: "mqtt-broker-local",
            x: 450,
            y: 300,
            wires: []
        },
        {
            id: "mqtt-broker-local",
            type: "mqtt-broker",
            name: "Local Broker",
            broker: "localhost",
            port: "1883",
            clientid: "",
            autoConnect: true,
            usetls: false,
            protocolVersion: "4",
            keepalive: "60",
            cleansession: true,
            birthTopic: "",
            birthQos: "0",
            birthPayload: "",
            birthMsg: {},
            closeTopic: "",
            closeQos: "0",
            closePayload: "",
            closeMsg: {},
            willTopic: "",
            willQos: "0",
            willPayload: "",
            willMsg: {},
            userProps: "",
            sessionExpiry: ""
        }
    ];

    try {
        // Deploy to Node-RED
        const response = await fetch('http://localhost:1881/flows', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Node-RED-Deployment-Type': 'nodes'
            },
            body: JSON.stringify(nodes)
        });

        if (response.ok) {
            console.log('✅ Node-RED Flow Deployed Successfully');
            res.json({ success: true, message: 'Flow deployed to Node-RED' });
        } else {
            const errText = await response.text();
            console.error('❌ Node-RED Deployment Failed:', errText);
            res.status(500).json({ success: false, message: 'Node-RED rejected flow' });
        }


    } catch (err) {
        console.error('❌ Node-RED Connection Error:', err.message);
        res.status(500).json({ success: false, message: 'Could not connect to Node-RED' });
    }
});

app.post('/api/nodered/import', async (req, res) => {
    try {
        const response = await fetch('http://localhost:1881/flows');
        if (!response.ok) throw new Error('Failed to fetch flows from Node-RED');

        const flows = await response.json();
        let importedCount = 0;
        const newTags = {};

        // Find all S7 Endpoint nodes
        const configNodes = flows.filter(n => n.type === 's7 endpoint');

        configNodes.forEach(node => {
            if (node.vartable && Array.isArray(node.vartable)) {
                node.vartable.forEach(v => {
                    if (v.name && v.addr) {
                        // Add to Tag Manager
                        tagManagerOpcua.addTag(v.name, v.addr);
                        newTags[v.name] = v.addr;
                        importedCount++;
                    }
                });
            }
        });

        // Sync with current driver
        if (currentPlc.updateTags) {
            currentPlc.updateTags(tagManagerOpcua.getTags());
        }

        csvLogger.init(tagManagerOpcua.getTags());

        res.json({
            success: true,
            message: `Imported ${importedCount} tags from Node-RED`,
            tags: newTags
        });
    } catch (err) {
        console.error('❌ Node-RED Import Error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/write', async (req, res) => {
    const { tagName, value, user } = req.body;
    if (!tagName || value === undefined || value === null) {
        return res.status(400).json({
            success: false,
            message: 'Tag name and value are required'
        });
    }

    try {
        const result = await currentPlc.writeData(tagName, value);

        // Log Audit
        logAudit(user ? user.username : 'system', 'WRITE_TAG', `Wrote ${value} to ${tagName}`);

        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('Frontend connected:', socket.id);

    // Send initial state
    socket.emit('plc-status', {
        connected: currentPlc.connected,
        protocol: currentProtocol
    });
    socket.emit('plc-data', currentPlc.values);
    socket.emit('mqtt-status', { connected: mqttService.connected });

    socket.on('disconnect', () => {
        console.log('Frontend disconnected:', socket.id);
    });
});

// Polling Loop
setInterval(async () => {
    // Always broadcast status
    io.emit('plc-status', {
        connected: currentPlc.connected,
        protocol: currentProtocol
    });

    if (currentPlc.connected) {
        const data = currentPlc.values;

        if (data && Object.keys(data).length > 0) {
            // Flatten data if needed (OPC UA driver returns objects with value property sometimes)
            const flatData = {};
            for (const [key, val] of Object.entries(data)) {
                if (val && typeof val === 'object' && 'value' in val) {
                    flatData[key] = val.value;
                } else {
                    flatData[key] = val;
                }
            }

            io.emit('plc-data', flatData);

            if (mqttService.connected) {
                mqttService.publish(flatData);
            }

            csvLogger.log(flatData);
        }
    }
}, 1000);

// Graceful shutdown
const shutdown = async () => {
    console.log('\n⚠️  Shutting down gracefully...');
    if (currentPlc.connected) {
        await currentPlc.disconnect();
    }
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start Server
const startSnapshotService = require('./snapshot-service');
startSnapshotService();

server.listen(PORT, '0.0.0.0', async () => {
    console.log(`\n🚀 LinQSynQ Backend (OPC UA) running on port ${PORT}`);
    console.log(`   (Supports OPC UA, Snap7, MQTT, Node-RED)\n`);
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  Default Protocol: ${currentProtocol}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    // Auto-connect on start
    await currentPlc.connect();
    mqttService.connect();
});
