const mqtt = require('mqtt');

class MQTTService {
    constructor() {
        this.client = null;
        this.connected = false;
        this.config = {
            brokerUrl: 'mqtt://broker.hivemq.com', // Public test broker
            topic: 'fuseflow/data'
        };
    }

    connect(brokerUrl, topic) {
        if (brokerUrl) this.config.brokerUrl = brokerUrl;
        if (topic) this.config.topic = topic;

        if (this.client) {
            this.client.end(); // Close existing connection if any
        }

        console.log(`Connecting to MQTT Broker at ${this.config.brokerUrl}...`);

        this.client = mqtt.connect(this.config.brokerUrl);

        this.client.on('connect', () => {
            console.log('✅ Connected to MQTT Broker!');
            this.connected = true;
        });

        this.client.on('error', (err) => {
            console.error('❌ MQTT Connection Error:', err);
            this.connected = false;
        });

        this.client.on('offline', () => {
            console.log('⚠️ MQTT Client Offline');
            this.connected = false;
        });
    }

    publish(data) {
        if (this.connected && this.client) {
            const payload = JSON.stringify(data);
            this.client.publish(this.config.topic, payload, (err) => {
                if (err) {
                    console.error('❌ MQTT Publish Error:', err);
                } else {
                    // console.log(`Sent to ${this.config.topic}:`, payload); // Verbose logging
                }
            });
        }
    }

    disconnect() {
        if (this.client) {
            this.client.end();
            this.connected = false;
        }
    }
}

module.exports = new MQTTService();
