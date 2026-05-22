/**
 * WebSocket处理器
 * 负责管理WebSocket连接和消息处理
 * 使用原生 WebSocket + STOMP-like JSON 消息格式
 */
class WebSocketHandler {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000;
        this.messageHandlers = {};
        this.connectionHandlers = {
            onOpen: [],
            onClose: [],
            onError: []
        };
    }

    connect(url = CONFIG.WS_URL) {
        return new Promise((resolve, reject) => {
            try {
                console.log(`正在连接到WebSocket服务器: ${url}`);
                this.socket = new WebSocket(url);

                this.socket.onopen = (event) => {
                    console.log('WebSocket连接已建立');
                    this.connected = true;
                    this.reconnectAttempts = 0;

                    this.connectionHandlers.onOpen.forEach(handler => {
                        try { handler(event); } catch (e) { console.error('onOpen handler error:', e); }
                    });

                    resolve(this.socket);
                };

                this.socket.onclose = (event) => {
                    console.log(`WebSocket连接已关闭: ${event.code} ${event.reason}`);
                    this.connected = false;

                    this.connectionHandlers.onClose.forEach(handler => {
                        try { handler(event); } catch (e) { console.error('onClose handler error:', e); }
                    });

                    if (this.reconnectAttempts === 0) {
                        this._attemptReconnect();
                    }
                };

                this.socket.onerror = (event) => {
                    console.error('WebSocket连接错误:', event);

                    this.connectionHandlers.onError.forEach(handler => {
                        try { handler(event); } catch (e) { console.error('onError handler error:', e); }
                    });

                    reject(new Error('WebSocket连接错误'));
                };

                this.socket.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        this._handleMessage(message);
                    } catch (error) {
                        console.error('处理WebSocket消息时出错:', error);
                    }
                };
            } catch (error) {
                console.error('创建WebSocket连接时出错:', error);
                reject(error);
            }
        });
    }

    _attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`尝试重新连接 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

            setTimeout(() => {
                this.connect().catch(error => {
                    console.error('重新连接失败:', error);
                });
            }, this.reconnectInterval);
        } else {
            console.error('达到最大重连次数，放弃重连');
        }
    }

    _handleMessage(message) {
        const type = message.type || message.messageType;

        if (type && this.messageHandlers[type]) {
            this.messageHandlers[type].forEach(handler => {
                try { handler(message); } catch (e) { console.error(`消息处理器(${type})出错:`, e); }
            });
        } else {
            console.warn(`未找到消息类型(${type})的处理器`);
        }
    }

    send(message) {
        if (!this.connected || !this.socket) {
            console.error('WebSocket未连接，无法发送消息');
            return false;
        }

        try {
            this.socket.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error('发送WebSocket消息时出错:', error);
            return false;
        }
    }

    sendChatMessage(content, receiver = null) {
        return this.send({
            type: CONFIG.MESSAGE_TYPES.CHAT,
            content: content,
            sender: window.currentUser ? window.currentUser.username : 'anonymous',
            receiver: receiver,
            timestamp: new Date().toISOString()
        });
    }

    sendCallRequest(targetUserId) {
        return this.send({
            type: CONFIG.MESSAGE_TYPES.CALL_REQUEST,
            targetUserId: targetUserId,
            timestamp: new Date().toISOString()
        });
    }

    sendCallResponse(targetUserId, accepted) {
        return this.send({
            type: CONFIG.MESSAGE_TYPES.CALL_RESPONSE,
            targetUserId: targetUserId,
            accepted: accepted,
            timestamp: new Date().toISOString()
        });
    }

    sendOffer(targetUserId, offer) {
        return this.send({
            type: CONFIG.MESSAGE_TYPES.OFFER,
            targetUserId: targetUserId,
            offer: offer,
            timestamp: new Date().toISOString()
        });
    }

    sendAnswer(targetUserId, answer) {
        return this.send({
            type: CONFIG.MESSAGE_TYPES.ANSWER,
            targetUserId: targetUserId,
            answer: answer,
            timestamp: new Date().toISOString()
        });
    }

    sendIceCandidate(targetUserId, candidate) {
        return this.send({
            type: CONFIG.MESSAGE_TYPES.ICE_CANDIDATE,
            targetUserId: targetUserId,
            candidate: candidate,
            timestamp: new Date().toISOString()
        });
    }

    addMessageHandler(type, handler) {
        if (!this.messageHandlers[type]) {
            this.messageHandlers[type] = [];
        }
        this.messageHandlers[type].push(handler);
    }

    addConnectionHandler(event, handler) {
        const eventKey = 'on' + event.charAt(0).toUpperCase() + event.slice(1);
        if (this.connectionHandlers[eventKey]) {
            this.connectionHandlers[eventKey].push(handler);
        }
    }

    disconnect() {
        if (this.socket) {
            this.connected = false;
            this.reconnectAttempts = this.maxReconnectAttempts + 1;
            this.socket.close();
            this.socket = null;
        }
    }
}
