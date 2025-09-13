// DroneFlow - Express Server with Supabase Integration

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import routes
const requestRoutes = require('./routes/requests');
const eventsRoutes = require('./routes/events');

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
    next();
});

// Rate limiting middleware (simple implementation)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; 
// 15 minutes
const MAX_REQUESTS = 100; 
// requests per window

app.use((req, res, next) => {
    const clientId = req.ip;
    const now = Date.now();
    
    if (!requestCounts.has(clientId)) {
        requestCounts.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    } else {
        const clientData = requestCounts.get(clientId);
        
        if (now > clientData.resetTime) {
            clientData.count = 1;
            clientData.resetTime = now + RATE_LIMIT_WINDOW;
        } else {
            clientData.count++;
        }
        
        if (clientData.count > MAX_REQUESTS) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.',
                retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
            });
        }
    }
    
    next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'DroneFlow API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API routes
app.use('/api/requests', requestRoutes);
app.use('/api/events', eventsRoutes.router);

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'DroneFlow API v1.0.0',
        endpoints: {
            'GET /health': 'Health check',
            'GET /api': 'API documentation',
            'GET /api/requests': 'Get all service requests',
            'GET /api/requests/stats': 'Get dashboard statistics',
            'GET /api/requests/:id': 'Get specific request by ID',
            'POST /api/requests': 'Create new service request',
            'PUT /api/requests/:id': 'Update service request',
            'DELETE /api/requests/:id': 'Delete service request'
        },
        documentation: 'https://github.com/droneflow/api-docs'
    });
});

// Handle SPA routing - serve index.html for non-API routes
app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
        return next();
    }
    
    // Serve index.html for all other routes
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Handle Supabase specific errors
    if (err.code && err.code.startsWith('PGRST')) {
        return res.status(400).json({
            success: false,
            message: 'Database operation failed',
            error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: err.errors
        });
    }
    
    // Handle JSON parsing errors
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON in request body'
        });
    }
    
    // Default error response
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        path: req.originalUrl
    });
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
    
    server.close(() => {
        console.log('HTTP server closed.');
        
        // Clear rate limiting data
        requestCounts.clear();
        
        console.log('Graceful shutdown completed.');
        process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`
🚁 DroneFlow Server Started Successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📡 Server running on: http://localhost:${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
📊 Database: ${process.env.SUPABASE_URL ? 'Supabase Connected' : 'Configuration Required'}
🔧 API Endpoint: http://localhost:${PORT}/api
📋 Health Check: http://localhost:${PORT}/health

Ready to accept drone service requests! 🎯
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
    
    // Log startup information
    console.log('Startup Configuration:');
    console.log('- Port:', PORT);
    console.log('- CORS Origin:', process.env.FRONTEND_URL || 'http://localhost:3000');
    console.log('- Rate Limiting:', `${MAX_REQUESTS} requests per ${RATE_LIMIT_WINDOW / 1000 / 60} minutes`);
    console.log('- Static Files:', path.join(__dirname, 'public'));
    console.log('- Supabase URL:', process.env.SUPABASE_URL ? 'Configured' : 'Not configured');
    console.log('');
});

module.exports = app;
