/**
 * ANTIBUG WhatsApp Bot Configuration
 * Author: Mr X
 * Version: 3.0.0
 */

require('dotenv').config();

const config = {
    // Server Configuration
    PORT: process.env.PORT || 3000,
    HOST: process.env.HOST || '0.0.0.0',
    NODE_ENV: process.env.NODE_ENV || 'production',

    // MongoDB Configuration
    MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/antibug',

    // Bot Configuration
    BOT_NAME: process.env.BOT_NAME || 'ANTIBUG',
    OWNER_NUMBER: process.env.OWNER_NUMBER || '263776509966',
    PREFIX: process.env.PREFIX || '.',

    // Session Configuration
    SESSION_BASE_PATH: process.env.SESSION_BASE_PATH || './sessions',
    SESSION_SECRET: process.env.SESSION_SECRET || 'antibug-secret-key-2024',

    // File Paths
    ADMIN_LIST_PATH: process.env.ADMIN_LIST_PATH || './data/admins.json',
    NUMBER_LIST_PATH: process.env.NUMBER_LIST_PATH || './data/numbers.json',
    NEWSLETTER_JID_PATH: process.env.NEWSLETTER_JID_PATH || './data/newsletters.json',
    RCD_IMAGE_PATH: process.env.RCD_IMAGE_PATH || 'https://i.imgur.com/JyR2Y9k.jpeg',

    // Auto Features
    AUTO_RECORDING: process.env.AUTO_RECORDING || 'true',
    AUTO_VIEW_STATUS: process.env.AUTO_VIEW_STATUS || 'true',
    AUTO_LIKE_STATUS: process.env.AUTO_LIKE_STATUS || 'true',
    AUTO_LIKE_EMOJI: ['❤️', '👍', '🔥', '😍', '🎉', '👏', '😊'],

    // Group Configuration
    GROUP_INVITE_LINK: process.env.GROUP_INVITE_LINK || 'https://chat.whatsapp.com/your-group-invite',

    // Newsletter Configuration
    NEWSLETTER_JID: process.env.NEWSLETTER_JID || '12036339637999999@newsletter',

    // Retry Configuration
    MAX_RETRIES: parseInt(process.env.MAX_RETRIES) || 3,
    RETRY_DELAY: parseInt(process.env.RETRY_DELAY) || 1000,

    // OTP Configuration
    OTP_EXPIRY: parseInt(process.env.OTP_EXPIRY) || 300000, // 5 minutes
    OTP_LENGTH: parseInt(process.env.OTP_LENGTH) || 6,

    // API Keys
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    WEATHER_API_KEY: process.env.WEATHER_API_KEY || '',
    NEWS_API_KEY: process.env.NEWS_API_KEY || '',

    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FILE: process.env.LOG_FILE || './logs/app.log',

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,

    // Security
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    TRUST_PROXY: process.env.TRUST_PROXY === 'true',

    // Health Check
    HEALTH_CHECK_PATH: process.env.HEALTH_CHECK_PATH || '/health',
};

// Ensure required directories exist
const fs = require('fs');
const path = require('path');

const directories = [
    config.SESSION_BASE_PATH,
    path.dirname(config.ADMIN_LIST_PATH),
    path.dirname(config.NUMBER_LIST_PATH),
    path.dirname(config.NEWSLETTER_JID_PATH),
    path.dirname(config.LOG_FILE)
];

directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
});

// Initialize data files if they don't exist
const dataFiles = [
    { path: config.ADMIN_LIST_PATH, defaultContent: [] },
    { path: config.NUMBER_LIST_PATH, defaultContent: [] },
    { path: config.NEWSLETTER_JID_PATH, defaultContent: { channels: [] } }
];

dataFiles.forEach(file => {
    if (!fs.existsSync(file.path)) {
        fs.writeFileSync(file.path, JSON.stringify(file.defaultContent, null, 2));
        console.log(`📄 Created file: ${file.path}`);
    }
});

module.exports = config;
