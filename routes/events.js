// DroneFlow - Server-Sent Events (SSE) Route for Real-time Updates

const express = require('express');
const router = express.Router();

// Store active SSE connections
const sseClients = new Set();

// SSE endpoint for real-time updates
router.get('/', (req, res) => {
    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Create client object
    const client = {
        id: Date.now(),
        response: res,
        lastPing: Date.now()
    };

    // Add client to active connections
    sseClients.add(client);
    
    console.log(`🔌 SSE client connected: ${client.id} (Total: ${sseClients.size})`);

    // Send initial connection message
    res.write(`data: ${JSON.stringify({
        type: 'connected',
        message: 'Real-time connection established',
        timestamp: new Date().toISOString()
    })}\n\n`);

    // Send heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
        try {
            res.write(`data: ${JSON.stringify({
                type: 'heartbeat',
                timestamp: new Date().toISOString()
            })}\n\n`);
            client.lastPing = Date.now();
        } catch (error) {
            console.error('Heartbeat error:', error);
            clearInterval(heartbeat);
            sseClients.delete(client);
        }
    }, 30000);

    // Handle client disconnect
    req.on('close', () => {
        console.log(`🔌 SSE client disconnected: ${client.id} (Total: ${sseClients.size - 1})`);
        clearInterval(heartbeat);
        sseClients.delete(client);
    });

    req.on('error', (error) => {
        console.error('SSE connection error:', error);
        clearInterval(heartbeat);
        sseClients.delete(client);
    });
});

// Function to broadcast message to all connected clients
function broadcastToClients(eventType, data) {
    const message = JSON.stringify({
        type: eventType,
        data: data,
        timestamp: new Date().toISOString()
    });

    console.log(`📡 Broadcasting ${eventType} to ${sseClients.size} clients`);

    // Send to all connected clients
    sseClients.forEach(client => {
        try {
            if (client.response && !client.response.destroyed) {
                client.response.write(`event: ${eventType}\n`);
                client.response.write(`data: ${message}\n\n`);
            } else {
                // Remove disconnected client
                sseClients.delete(client);
            }
        } catch (error) {
            console.error('Broadcast error:', error);
            sseClients.delete(client);
        }
    });
}

// Function to send notification to specific client
function sendToClient(clientId, eventType, data) {
    const client = Array.from(sseClients).find(c => c.id === clientId);
    if (client && client.response && !client.response.destroyed) {
        try {
            const message = JSON.stringify({
                type: eventType,
                data: data,
                timestamp: new Date().toISOString()
            });
            
            client.response.write(`event: ${eventType}\n`);
            client.response.write(`data: ${message}\n\n`);
        } catch (error) {
            console.error('Send to client error:', error);
            sseClients.delete(client);
        }
    }
}

// Function to get connection stats
function getConnectionStats() {
    return {
        totalConnections: sseClients.size,
        activeConnections: Array.from(sseClients).filter(client => 
            client.response && !client.response.destroyed
        ).length,
        oldConnections: Array.from(sseClients).filter(client => 
            Date.now() - client.lastPing > 60000
        ).length
    };
}

// Cleanup function for old connections
function cleanupConnections() {
    const now = Date.now();
    const staleTimeout = 5 * 60 * 1000; // 5 minutes
    
    sseClients.forEach(client => {
        if (now - client.lastPing > staleTimeout) {
            console.log(`🧹 Cleaning up stale connection: ${client.id}`);
            try {
                if (client.response && !client.response.destroyed) {
                    client.response.end();
                }
            } catch (error) {
                console.error('Cleanup error:', error);
            }
            sseClients.delete(client);
        }
    });
}

// Run cleanup every 5 minutes
setInterval(cleanupConnections, 5 * 60 * 1000);

// Export functions for use in other routes
module.exports = {
    router,
    broadcastToClients,
    sendToClient,
    getConnectionStats
};