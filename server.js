const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const plc = require('./plc');

const mqttService = require('./mqtt-client');

const tagManager = require('./tag-manager');
const csvLogger = require('./csv-logger');

// Initialize modules
plc.variables = tagManager.getTags();
csvLogger.init(plc.variables);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for dev, restrict in prod
        methods: ["GET", "POST", "DELETE"]
    }
});

app.use(cors());
app.use(express.json());

const PORT = 3001;

// API Routes
app.get('/api/status', (req, res) => {
    res.json({
        connected: plc.connected,
        config: plc.config,
        tags: tagManager.getTags(),
        mqtt: {
            connected: mqttService.connected,
            config: mqttService.config
        }
    });
});

app.post('/api/connect', async (req, res) => {
    const { ip, rack, slot } = req.body;
    const success = await plc.connect(ip, rack, slot);
    res.json({ success, connected: plc.connected });
});

app.post('/api/mqtt/connect', (req, res) => {
    const { brokerUrl, topic } = req.body;
    mqttService.connect(brokerUrl, topic);
    res.json({ success: true });
});

app.post('/api/tags', (req, res) => {
    const { name, address } = req.body;
    if (name && address) {
        const newTags = tagManager.addTag(name, address);
        plc.updateTags(newTags);
        csvLogger.init(newTags); // Update logger headers
        res.json({ success: true, tags: newTags });
    } else {
        res.status(400).json({ success: false, message: 'Name and Address required' });
    }
});

app.delete('/api/tags/:name', (req, res) => {
    const { name } = req.params;
    const newTags = tagManager.removeTag(name);
    plc.updateTags(newTags);
    csvLogger.init(newTags);
    res.json({ success: true, tags: newTags });
});

app.post('/api/write', async (req, res) => {
    const { tagName, value } = req.body;
    if (!tagName || value === undefined || value === null) {
        return res.status(400).json({
            success: false,
            message: 'Tag name and value are required'
        });
    }

    try {
        const result = await plc.writeData(tagName, value);
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
    socket.emit('plc-status', { connected: plc.connected });
    socket.emit('plc-data', plc.values);
    socket.emit('mqtt-status', { connected: mqttService.connected });

    socket.on('disconnect', () => {
        console.log('Frontend disconnected:', socket.id);
    });
});

// Polling Loop
setInterval(async () => {
    if (plc.connected) {
        const data = await plc.readData();
        if (data) {
            io.emit('plc-data', data);

            // Publish to MQTT if connected
            if (mqttService.connected) {
                mqttService.publish(data);
            }

            // Log to CSV
            csvLogger.log(data);
        }
    }
}, 1000); // Read every 1 second

// Start Server
server.listen(PORT, () => {
    console.log(`FuseFlow Server running on http://localhost:${PORT}`);

    // Auto-connect on start (optional, using default or env vars)
    plc.connect();
    mqttService.connect(); // Connect to default public broker for demo
});
