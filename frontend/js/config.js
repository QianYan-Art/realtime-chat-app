const CONFIG = {
    API_BASE_URL: getApiBaseUrl(),
    WS_URL: getWebSocketUrl(),

    ICE_SERVERS: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ],

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

    STORAGE_KEYS: {
        USER_INFO: 'user_info',
        TOKEN: 'auth_token'
    },

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

function getApiBaseUrl() {
    if (window.location.hostname.includes('sealos.run')) {
        return '/api';
    }
    return '/api';
}

function getWebSocketUrl() {
    if (window.location.hostname.includes('sealos.run')) {
        return `wss://${window.location.host}/ws`;
    }
    // 本地开发：直连后端（前端 server.js 的 /ws 代理不支持 STOMP 子协议）
    return `ws://localhost:8083/ws`;
}
