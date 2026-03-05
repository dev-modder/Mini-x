/**
 * ANTIBUG WhatsApp Bot - Message Utilities
 * Author: Mr X
 * Version: 3.0.0
 */

const { getContentType, downloadContentFromMessage } = require('@whiskeysockets/baileys');
const FileType = require('file-type');
const fs = require('fs');
const path = require('path');

/**
 * Download media message
 */
const downloadMediaMessage = async (message, filename = (Date.now()).toString(), attachExtension = true) => {
    try {
        let quoted = message.msg ? message.msg : message;
        let mime = (message.msg || message).mimetype || '';
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
        
        const stream = await downloadContentFromMessage(quoted, messageType);
        let buffer = Buffer.from([]);
        
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        
        let type = await FileType.fromBuffer(buffer);
        const trueFileName = attachExtension ? (filename + '.' + (type ? type.ext : 'bin')) : filename;
        
        // Ensure temp directory exists
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const filePath = path.join(tempDir, trueFileName);
        await fs.writeFileSync(filePath, buffer);
        
        return filePath;
    } catch (error) {
        console.error('Download media error:', error);
        throw error;
    }
};

/**
 * Simple Message Structure Parser
 */
const sms = (socket, msg) => {
    if (!msg) return {};
    
    const type = getContentType(msg.message);
    const from = msg.key.remoteJid;
    const isGroup = from?.endsWith('@g.us');
    const sender = isGroup ? msg.key.participant : from;
    const body = type === 'conversation' 
        ? msg.message.conversation 
        : msg.message?.extendedTextMessage?.text 
        || msg.message?.imageMessage?.caption 
        || msg.message?.videoMessage?.caption 
        || '';
    
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    
    return {
        type,
        from,
        isGroup,
        sender,
        body,
        quoted,
        mentioned,
        pushName: msg.pushName || 'Unknown',
        key: msg.key,
        message: msg.message,
        msg: msg,
        socket: socket
    };
};

/**
 * Get group metadata
 */
const getGroupMetadata = async (socket, jid) => {
    try {
        const metadata = await socket.groupMetadata(jid);
        return metadata;
    } catch (error) {
        console.error('Get group metadata error:', error);
        return null;
    }
};

/**
 * Get group participants
 */
const getGroupParticipants = async (socket, jid) => {
    try {
        const metadata = await getGroupMetadata(socket, jid);
        return metadata?.participants || [];
    } catch (error) {
        console.error('Get group participants error:', error);
        return [];
    }
};

/**
 * Format phone number
 */
const formatPhone = (number) => {
    return number.replace(/[^0-9]/g, '');
};

/**
 * Generate random ID
 */
const generateId = (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Format bytes to human readable
 */
const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Sleep function
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Parse mentioned JIDs from message
 */
const parseMentioned = (text) => {
    return [...text.matchAll(/@([0-9]{5,}|)/g)].map(v => v[1] + '@s.whatsapp.net');
};

module.exports = {
    downloadMediaMessage,
    sms,
    getGroupMetadata,
    getGroupParticipants,
    formatPhone,
    generateId,
    formatBytes,
    sleep,
    parseMentioned
};
