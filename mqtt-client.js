// mqtt-client.js

// Import required modules if running in Node.js environment
let mqtt;
if (typeof window === 'undefined') {
  mqtt = require('mqtt');
}

// MQTT client setup for device communication
const mqttClient = {
    client: null,
    brokerUrl: 'wss://broker.hivemq.com:8884/mqtt',  // Using secure WebSocket
    subscriptions: {},
    deviceCallbacks: new Map(),
    isConnected: false,

    async connect() {
        return new Promise((resolve, reject) => {
            try {
                this.client = mqtt.connect(this.brokerUrl, {
                    keepalive: 60,
                    clean: true,
                    reconnectPeriod: 1000,
                    connectTimeout: 5000,
                    rejectUnauthorized: false // Required for self-signed certificates
                });

                this.client.on('connect', () => {
                    console.log('Connected to MQTT broker');
                    this.isConnected = true;
                    resolve();
                });

                this.client.on('error', (error) => {
                    console.error('MQTT connection error:', error);
                    this.isConnected = false;
                    reject(error);
                });

                this.client.on('message', (topic, message) => {
                    this.handleMessage(topic, message);
                });

                this.client.on('disconnect', () => {
                    console.log('Disconnected from MQTT broker');
                    this.isConnected = false;
                });

            } catch (error) {
                console.error('Failed to connect to MQTT broker:', error);
                this.isConnected = false;
                reject(error);
            }
        });
    },

    subscribe(deviceId) {
        if (!this.client || !this.isConnected) {
            console.warn('Cannot subscribe: MQTT client not connected');
            return;
        }

        const topic = `iot/devices/${deviceId}/+`;
        
        if (!this.subscriptions[deviceId]) {
            this.client.subscribe(topic, (err) => {
                if (err) {
                    console.error(`Failed to subscribe to ${topic}:`, err);
                } else {
                    console.log(`Subscribed to ${topic}`);
                    this.subscriptions[deviceId] = true;
                }
            });
        }
    },

    unsubscribe(deviceId) {
        if (!this.client || !this.isConnected) {
            console.warn('Cannot unsubscribe: MQTT client not connected');
            return;
        }

        const topic = `iot/devices/${deviceId}/+`;
        
        if (this.subscriptions[deviceId]) {
            this.client.unsubscribe(topic, (err) => {
                if (err) {
                    console.error(`Failed to unsubscribe from ${topic}:`, err);
                } else {
                    console.log(`Unsubscribed from ${topic}`);
                    delete this.subscriptions[deviceId];
                }
            });
        }
    },

    publish(deviceId, message) {
        if (!this.client || !this.isConnected) {
            console.warn('Cannot publish: MQTT client not connected');
            return;
        }

        const topic = `iot/devices/${deviceId}/command`;
        this.client.publish(topic, JSON.stringify(message), { qos: 1 }, (err) => {
            if (err) {
                console.error(`Failed to publish to ${topic}:`, err);
            }
        });
    },

    handleMessage(topic, message) {
        try {
            const [, , deviceId, type] = topic.split('/');
            const data = JSON.parse(message.toString());
            
            // Enhanced logging
            console.log('MQTT Message Received:');
            console.log('Topic:', topic);
            console.log('Device ID:', deviceId);
            console.log('Message:', data);

            // Call the registered callback for this device if it exists
            const callback = this.deviceCallbacks.get(deviceId);
            if (callback) {
                callback(data);
            }

            // Emit a custom event for this device update
            const event = new CustomEvent('deviceUpdate', {
                detail: {
                    deviceId,
                    type,
                    data
                }
            });
            document.dispatchEvent(event);

        } catch (error) {
            console.error('Error handling MQTT message:', error);
        }
    },

    onDeviceUpdate(deviceId, callback) {
        if (!this.subscriptions[deviceId]) {
            this.subscribe(deviceId);
        }
        this.deviceCallbacks.set(deviceId, callback);
    },

    removeDeviceCallback(deviceId) {
        this.deviceCallbacks.delete(deviceId);
        if (!this.deviceCallbacks.size) {
            this.unsubscribe(deviceId);
        }
    },

    requestStatus(deviceId) {
        this.publish(deviceId, { command: 'get_status' });
    }
};

// Initialize MQTT client when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await mqttClient.connect();
        console.log('MQTT client initialized successfully');
    } catch (error) {
        console.error('Failed to initialize MQTT client:', error);
    }
});

// Export the module for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = mqttClient;
}
