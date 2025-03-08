/**
 * 应用配置
 * 包含应用程序的全局配置项
 */
const CONFIG = {
    // API配置 - 自动检测当前环境
    API_BASE_URL: getApiBaseUrl(),
    
    // WebSocket配置 - 自动检测当前环境
    WS_URL: getWebSocketUrl(),
    
    // ICE服务器配置（用于WebRTC连接）
    ICE_SERVERS: [
        {
            urls: 'stun:stun.l.google.com:19302'
        },
        {
            urls: 'stun:stun1.l.google.com:19302'
        },
        {
            urls: 'stun:stun2.l.google.com:19302'
        }
    ],
    
    // 视频约束配置
    VIDEO_CONSTRAINTS: {
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        },
        video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
        }
    },
    
    // 本地存储键
    STORAGE_KEYS: {
        USER_INFO: 'user_info',
        TOKEN: 'auth_token'
    },
    
    // 消息类型
    MESSAGE_TYPES: {
        CHAT: 'CHAT',
        JOIN: 'JOIN',
        LEAVE: 'LEAVE',
        CALL_REQUEST: 'CALL_REQUEST',
        CALL_RESPONSE: 'CALL_RESPONSE',
        ICE_CANDIDATE: 'ICE_CANDIDATE',
        OFFER: 'OFFER',
        ANSWER: 'ANSWER'
    }
};

/**
 * 获取API基础URL
 * 根据当前环境自动选择合适的API地址
 * @returns {string} API基础URL
 */
function getApiBaseUrl() {
    // 检查是否在Sealos Devbox环境中
    if (window.location.hostname.includes('sealos.run')) {
        // 在Sealos环境中，使用相对路径，由Nginx代理转发
        return '/api';
    }
    
    // 本地开发环境，使用相对路径
    return '/api';
}

/**
 * 获取WebSocket URL
 * 根据当前环境自动选择合适的WebSocket地址
 * @returns {string} WebSocket URL
 */
function getWebSocketUrl() {
    // 检查是否在Sealos Devbox环境中
    if (window.location.hostname.includes('sealos.run')) {
        // 在Sealos环境中，使用WSS协议
        return `wss://${window.location.host}/ws`;
    }
    
    // 本地开发环境，使用前端服务器端口3000，通过代理转发到后端WebSocket
    return `ws://${window.location.hostname}:3000/ws`;
}