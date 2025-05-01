// websocket-client.js

// Initialize WebSocket connection to receive MQTT updates from the server
let wsConnection;

function initWebSocket() {
    // Close any existing connection
    if (wsConnection) {
        wsConnection.close();
    }

    // Create WebSocket connection
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.hostname}:3001`;
    
    wsConnection = new WebSocket(wsUrl);
    
    wsConnection.onopen = () => {
        console.log('WebSocket connection established');
        document.querySelector('.status-indicator')?.classList.add('connected');
        document.querySelector('.status-text').textContent = 'Connected';
    };
    
    wsConnection.onclose = () => {
        console.log('WebSocket connection closed');
        document.querySelector('.status-indicator')?.classList.remove('connected');
        document.querySelector('.status-text').textContent = 'Disconnected';
        
        // Try to reconnect after 5 seconds
        setTimeout(initWebSocket, 5000);
    };
    
    wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
        document.querySelector('.status-indicator')?.classList.remove('connected');
        document.querySelector('.status-text').textContent = 'Connection Error';
    };
    
    wsConnection.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            
            // Handle initialization data (all current states)
            if (data.type === 'init' && data.states) {
                Object.entries(data.states).forEach(([deviceId, deviceData]) => {
                    updateSlotStatus(deviceId, deviceData);
                });
                return;
            }
            
            // Handle individual device updates
            if (data.device) {
                updateSlotStatus(data.device, data);
            }
        } catch (err) {
            console.error('Error processing WebSocket message:', err);
        }
    };
}

// Update slot status based on device data
function updateSlotStatus(deviceId, data) {
    // Find all slots with this device ID
    const slots = document.querySelectorAll(`[data-device-id="${deviceId}"]`);
    
    if (slots.length === 0) {
        return; // No slots found with this device ID
    }
    
    const status = data.relay === 'HIGH';
    const distance = parseFloat(data.distance || 0).toFixed(2);
    
    slots.forEach(slot => {
        // Update slot class for color change
        slot.className = `slot ${status ? 'occupied' : 'available'}`;
        
        // Add animation effect
        slot.classList.add('status-change');
        setTimeout(() => slot.classList.remove('status-change'), 1000);
        
        // Update device info if it exists
        const deviceInfo = slot.querySelector('.device-info');
        if (deviceInfo) {
            const statusElement = deviceInfo.querySelector('.device-status');
            if (statusElement) {
                statusElement.textContent = status ? 'Occupied' : 'Available';
            }
        }
        
        // If we're in a preview, update that too
        const previewOverlay = document.getElementById('preview-overlay');
        if (previewOverlay && !previewOverlay.classList.contains('hidden')) {
            // Find the zone containing this slot
            const zone = slot.closest('.zone');
            if (zone) {
                showZonePreview(zone);
            }
        }
    });
}

// Initialize WebSocket when the page loads
document.addEventListener('DOMContentLoaded', initWebSocket);

// Export functions for use in other scripts
window.wsClient = {
    initWebSocket,
    updateSlotStatus
};