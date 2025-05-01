const express = require('express');
const path = require('path');
const mqtt = require('mqtt');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;
const WSPORT = 3001;

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Route for the home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`Website running at http://localhost:${PORT}`);
});

// WebSocket server setup
const wsServer = new WebSocket.Server({ port: WSPORT });
const clients = [];

wsServer.on('connection', (socket) => {
    console.log('Browser connected via WebSocket');
    clients.push(socket);

    socket.on('close', () => {
        const i = clients.indexOf(socket);
        if (i !== -1) clients.splice(i, 1);
        console.log('Browser disconnected');
    });
});

// MQTT Setup
const mqttOptions = {
    host: '2a086fbdeb91453eacd25659758b74f3.s1.eu.hivemq.cloud',
    port: 8883,
    protocol: 'mqtts',
    username: 'maharshi',
    password: 'Maharshi24'
};

const mqttClient = mqtt.connect(mqttOptions);

mqttClient.on('connect', () => {
    console.log('Connected to HiveMQ Cloud');
    console.log('Subscribing to iot/devices/#');
    mqttClient.subscribe('iot/devices/#', (err) => {
        if (err) {
            console.error('MQTT Subscribe error:', err);
        } else {
            console.log('Successfully subscribed to iot/devices/#');
        }
    });
});

mqttClient.on('message', (topic, message) => {
    try {
        const data = JSON.parse(message.toString());
        console.log('MQTT Message Received:');
        console.log('Topic:', topic);
        console.log('Data:', data);

        // Forward to all connected WebSocket clients
        clients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    topic,
                    ...data
                }));
            }
        });
    } catch (err) {
        console.error('MQTT message parsing error:', err);
        console.log('Raw message:', message.toString());
    }
});

mqttClient.on('error', (error) => {
    console.error('MQTT Error:', error);
});

mqttClient.on('disconnect', () => {
    console.log('Disconnected from MQTT broker');
});

mqttClient.on('reconnect', () => {
    console.log('Attempting to reconnect to MQTT broker...');
});