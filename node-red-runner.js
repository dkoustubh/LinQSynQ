const http = require('http');
const express = require('express');
const RED = require('node-red');

// Create an Express app
const app = express();

// Add a simple route for static content
app.use('/', express.static('public'));

// Create a server
const server = http.createServer(app);

// Create the settings object - see default settings.js file for other options
const settings = {
    httpAdminRoot: '/red',
    httpNodeRoot: '/api',
    userDir: require('path').join(__dirname, '.nodered'), // Use absolute path
    functionGlobalContext: {}    // enables global context
};

// Initialise the runtime with a server and settings
RED.init(server, settings);

// Serve the editor UI from /red
app.use(settings.httpAdminRoot, RED.httpAdmin);

// Serve the http nodes UI from /api
app.use(settings.httpNodeRoot, RED.httpNode);

server.listen(1881);

// Start the runtime
RED.start().then(() => {
    console.log('✅ Node-RED started successfully!');
    console.log('Go to: http://localhost:1881/red');
}).catch(err => {
    console.error('❌ Node-RED failed to start:');
    console.error(err);
    process.exit(1);
});
