const {
    OPCUAClient,
    MessageSecurityMode,
    SecurityPolicy,
    AttributeIds,
    ClientSubscription,
    TimestampsToReturn,
    MonitoringParametersOptions,
    ReadValueIdOptions,
    ClientMonitoredItem,
    DataValue
} = require("node-opcua-client");

class OPCUAService {
    constructor() {
        this.client = null;
        this.session = null;
        this.subscription = null;
        this.connected = false;
        this.values = {};
        this.monitoredItems = new Map();

        this.config = {
            endpointUrl: 'opc.tcp://192.168.103.24:4840',
            securityMode: MessageSecurityMode.None,
            securityPolicy: SecurityPolicy.None,
            connectionTimeout: 5000,
            requestedSessionTimeout: 60000
        };

        // Tags from your Spring Boot configuration
        this.tags = {
            'Tag1': 'ns=0;i=2253',
            'Tag2': 'ns=2;i=5001',
            'PLC': 'ns=3;s=PLC',
            'STKR1_HeartBit': 'ns=3;s="PLC_To_WMS"."STKR1_Heart Bit"',
            'ProductionData': 'ns=2;s=Telegram_Production',
            'MachineStatus': 'ns=2;s=Telegram_Status',
            'ProcessValues': 'ns=2;s=Telegram_Process'
        };
    }

    async connect(endpointUrl = null) {
        if (endpointUrl) {
            this.config.endpointUrl = endpointUrl;
        }

        console.log(`\n🔌 Connecting to OPC UA Server: ${this.config.endpointUrl}`);
        console.log(`   Security: ${this.config.securityMode} / ${this.config.securityPolicy}\n`);

        try {
            // Create client
            this.client = OPCUAClient.create({
                applicationName: "FuseFlow OPC UA Client",
                connectionStrategy: {
                    initialDelay: 1000,
                    maxRetry: 3
                },
                securityMode: this.config.securityMode,
                securityPolicy: this.config.securityPolicy,
                endpointMustExist: false,
                requestedSessionTimeout: this.config.requestedSessionTimeout
            });

            // Connect to server
            await this.client.connect(this.config.endpointUrl);
            console.log('✅ Connected to OPC UA Server');

            // Create session
            this.session = await this.client.createSession();
            console.log('✅ Session created');

            this.connected = true;

            // Create subscription for monitoring
            await this.createSubscription();

            // Add initial tags
            await this.addTagsToMonitor(this.tags);

            return true;
        } catch (err) {
            console.error('❌ OPC UA Connection Failed:', err.message);
            this.connected = false;
            return false;
        }
    }

    async createSubscription() {
        if (!this.session) return;

        this.subscription = await this.session.createSubscription2({
            requestedPublishingInterval: 1000,
            requestedLifetimeCount: 100,
            requestedMaxKeepAliveCount: 10,
            maxNotificationsPerPublish: 100,
            publishingEnabled: true,
            priority: 10
        });

        console.log('✅ Subscription created');

        this.subscription.on("started", () => {
            console.log("📡 Subscription started - monitoring for changes");
        });

        this.subscription.on("terminated", () => {
            console.log("⚠️  Subscription terminated");
        });
    }

    async addTagsToMonitor(tags) {
        if (!this.subscription) return;

        for (const [tagName, nodeId] of Object.entries(tags)) {
            try {
                const itemToMonitor = {
                    nodeId: nodeId,
                    attributeId: AttributeIds.Value
                };

                const parameters = {
                    samplingInterval: 1000,
                    discardOldest: true,
                    queueSize: 10
                };

                const monitoredItem = await this.subscription.monitor(
                    itemToMonitor,
                    parameters,
                    TimestampsToReturn.Both
                );

                monitoredItem.on("changed", (dataValue) => {
                    this.values[tagName] = this.extractValue(dataValue);
                });

                this.monitoredItems.set(tagName, monitoredItem);
                console.log(`✅ Monitoring: ${tagName} (${nodeId})`);
            } catch (err) {
                console.error(`❌ Failed to monitor ${tagName}:`, err.message);
            }
        }
    }

    extractValue(dataValue) {
        if (!dataValue || !dataValue.value) return null;

        const value = dataValue.value.value;
        const statusCode = dataValue.statusCode;

        return {
            value: value,
            quality: statusCode.name || 'Good',
            timestamp: dataValue.sourceTimestamp || new Date(),
            statusCode: statusCode.value
        };
    }

    async readData() {
        if (!this.session || !this.connected) {
            return null;
        }

        try {
            const nodeIds = Object.values(this.tags);
            const dataValues = await this.session.read(
                nodeIds.map(nodeId => ({
                    nodeId: nodeId,
                    attributeId: AttributeIds.Value
                }))
            );

            const result = {};
            const tagNames = Object.keys(this.tags);

            dataValues.forEach((dataValue, index) => {
                const tagName = tagNames[index];
                result[tagName] = this.extractValue(dataValue);
            });

            this.values = result;
            return result;
        } catch (err) {
            console.error('❌ Error reading OPC UA data:', err.message);
            return null;
        }
    }

    convertValueToType(value, dataType) {
        // Convert string input to proper type based on OPC UA DataType
        // DataType values: 1=Boolean, 2=SByte, 3=Byte, 4=Int16, 6=Int32, 10=Float, 11=Double, 12=String

        const dataTypeMap = {
            1: 'Boolean',
            2: 'SByte',
            3: 'Byte',
            4: 'Int16',
            5: 'UInt16',
            6: 'Int32',
            7: 'UInt32',
            8: 'Int64',
            9: 'UInt64',
            10: 'Float',
            11: 'Double',
            12: 'String',
            13: 'DateTime'
        };

        const typeName = dataTypeMap[dataType] || 'Unknown';
        console.log(`Converting value "${value}" (${typeof value}) to ${typeName} (dataType ${dataType})`);

        // If value is already the correct type, return it
        if (dataType === 1 && typeof value === 'boolean') return value;
        if ((dataType >= 2 && dataType <= 9) && typeof value === 'number') return value;
        if ((dataType === 10 || dataType === 11) && typeof value === 'number') return value;
        if (dataType === 12 && typeof value === 'string') return value;

        // Convert string to appropriate type
        if (typeof value === 'string') {
            switch (dataType) {
                case 1: // Boolean
                    return value.toLowerCase() === 'true' || value === '1';

                case 2: // SByte (-128 to 127)
                case 3: // Byte (0 to 255)
                case 4: // Int16
                case 5: // UInt16
                case 6: // Int32
                case 7: // UInt32
                    const intValue = parseInt(value, 10);
                    if (isNaN(intValue)) {
                        throw new Error(`Cannot convert "${value}" to integer`);
                    }
                    return intValue;

                case 8: // Int64
                case 9: // UInt64
                    const bigIntValue = BigInt(value);
                    return bigIntValue;

                case 10: // Float
                case 11: // Double
                    const floatValue = parseFloat(value);
                    if (isNaN(floatValue)) {
                        throw new Error(`Cannot convert "${value}" to float`);
                    }
                    return floatValue;

                case 12: // String
                    return value;

                default:
                    return value;
            }
        }

        return value;
    }

    async writeData(tagName, value) {
        if (!this.session || !this.connected) {
            throw new Error('OPC UA not connected');
        }

        if (!this.tags[tagName]) {
            throw new Error(`Tag \"${tagName}\" not found`);
        }

        try {
            const nodeId = this.tags[tagName];

            // Read the node first to get its data type
            const dataValue = await this.session.read({
                nodeId: nodeId,
                attributeId: AttributeIds.Value
            });

            const dataType = dataValue.value.dataType;

            // Convert value to the correct type
            const convertedValue = this.convertValueToType(value, dataType);

            console.log(`Writing to ${tagName}: ${convertedValue} (type: ${typeof convertedValue})`);

            // Write the value
            const statusCode = await this.session.write({
                nodeId: nodeId,
                attributeId: AttributeIds.Value,
                value: {
                    value: {
                        dataType: dataType,
                        value: convertedValue
                    }
                }
            });

            if (statusCode.isGood()) {
                console.log(`✅ Successfully wrote value "${convertedValue}" to tag \"${tagName}\"`);
                return { success: true, tag: tagName, value: convertedValue };
            } else {
                throw new Error(`Write failed with status: ${statusCode.name}`);
            }
        } catch (err) {
            console.error(`❌ Error writing to tag \"${tagName}\":`, err.message);
            throw err;
        }
    }

    updateTags(newTags) {
        // Merge new tags
        this.tags = { ...this.tags, ...newTags };

        // Re-subscribe if connected
        if (this.connected && this.subscription) {
            this.addTagsToMonitor(newTags);
        }
    }

    removeTag(tagName) {
        if (this.monitoredItems.has(tagName)) {
            const item = this.monitoredItems.get(tagName);
            item.terminate();
            this.monitoredItems.delete(tagName);
        }
        delete this.tags[tagName];
        delete this.values[tagName];
        return this.tags;
    }

    async disconnect() {
        console.log('\n🔌 Disconnecting from OPC UA Server...');

        try {
            if (this.subscription) {
                await this.subscription.terminate();
                this.subscription = null;
            }

            if (this.session) {
                await this.session.close();
                this.session = null;
            }

            if (this.client) {
                await this.client.disconnect();
                this.client = null;
            }

            this.connected = false;
            console.log('✅ Disconnected successfully\n');
        } catch (err) {
            console.error('❌ Error during disconnect:', err.message);
        }
    }

    getConnectionInfo() {
        return {
            endpointUrl: this.config.endpointUrl,
            connected: this.connected,
            session: this.session !== null,
            subscription: this.subscription !== null,
            monitoredItemsCount: this.monitoredItems.size,
            tags: Object.keys(this.tags)
        };
    }
}

module.exports = new OPCUAService();
