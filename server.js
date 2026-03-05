/**
 * ANTIBUG WhatsApp Bot - Main Server
 * Author: Mr X
 * Version: 3.0.0
 * 
 * Deployable on: Render, Heroku, Railway, Vercel, etc.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const fs = require('fs-extra');
const path = require('path');
const mongoose = require('mongoose');

const config = require('./config');
const pairRouter = require('./pair');

// Initialize Express App
const app = express();

// Trust proxy for production deployments (Render, Heroku, etc.)
if (config.TRUST_PROXY) {
    app.enable('trust proxy');
}

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// CORS Configuration
app.use(cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression
app.use(compression());

// Body Parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
if (config.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    // Create logs directory if it doesn't exist
    const logsDir = path.dirname(config.LOG_FILE);
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
    const logStream = fs.createWriteStream(config.LOG_FILE, { flags: 'a' });
    app.use(morgan('combined', { stream: logStream }));
    app.use(morgan('combined'));
}

// Health Check Endpoint
app.get(config.HEALTH_CHECK_PATH, async (req, res) => {
    const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.NODE_ENV,
        version: '3.0.0',
        author: 'Mr X',
        bot: 'ANTIBUG',
        mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            unit: 'MB'
        }
    };

    res.status(200).json(health);
});

// Root Endpoint
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>ANTIBUG WhatsApp Bot</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #1a1a2e; color: #eee; }
                    h1 { color: #00d4ff; }
                    .info { background: #16213e; padding: 20px; border-radius: 10px; margin: 20px auto; max-width: 500px; }
                    .status { color: #00ff88; }
                </style>
            </head>
            <body>
                <h1>🛡️ ANTIBUG WhatsApp Bot</h1>
                <div class="info">
                    <p><strong>Version:</strong> 3.0.0</p>
                    <p><strong>Author:</strong> Mr X</p>
                    <p><strong>Status:</strong> <span class="status">Online ✅</span></p>
                    <p><strong>Uptime:</strong> ${Math.floor(process.uptime())} seconds</p>
                </div>
                <p>Deployed on: ${process.env.RENDER ? 'Render' : process.env.HEROKU ? 'Heroku' : 'Custom Server'}</p>
            </body>
        </html>
    `);
});

// API Routes
app.use('/', pairRouter);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        status: 'error',
        message: config.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
        timestamp: new Date().toISOString()
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Endpoint not found',
        timestamp: new Date().toISOString()
    });
});

// MongoDB Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 50,
            connectTimeoutMS: 10000
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        console.log('⚠️ Retrying connection in 5 seconds...');
        setTimeout(connectDB, 5000);
    }
};

// Graceful Shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed.');
    } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error);
    }
    
    server.close(() => {
        console.log('✅ HTTP server closed.');
        process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
        console.error('⚠️ Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

// Process Handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start Server
const startServer = async () => {
    await connectDB();
    
    const server = app.listen(config.PORT, config.HOST, () => {
        console.log('');
        console.log('╔══════════════════════════════════════╗');
        console.log('║     🛡️  ANTIBUG WhatsApp Bot  🛡️     ║');
        console.log('║          Version: 3.0.0              ║');
        console.log('║          Author: Mr X                ║');
        console.log('╚══════════════════════════════════════╝');
        console.log('');
        console.log(`🌐 Server running on: http://${config.HOST}:${config.PORT}`);
        console.log(`🌍 Environment: ${config.NODE_ENV}`);
        console.log(`📊 Health Check: http://${config.HOST}:${config.PORT}${config.HEALTH_CHECK_PATH}`);
        console.log(`📱 Bot Prefix: ${config.PREFIX}`);
        console.log(`👤 Owner: ${config.OWNER_NUMBER}`);
        console.log('');
        console.log('Press Ctrl+C to stop the server');
        console.log('');
    });

    return server;
};

// Initialize
startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

module.exports = app;
