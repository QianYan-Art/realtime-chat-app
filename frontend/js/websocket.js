class WebSocketHandler {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000;
        this.messageHandlers = {};
        this.connectionHandlers = { onOpen: [], onClose: [], onError: [] };
        this._subscriptions = {};
        this._subId = 0;
    }

    connect(url = CONFIG.WS_URL) {
        return new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket(url);

                this.socket.onopen = (event) => {
                    this.connected = true;
                    this.reconnectAttempts = 0;
                    // CONNECT 帧，携带 JWT token
                    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN) || '';
                    const connectFrame = token
                        ? `CONNECT\naccept-version:1.2\nheart-beat:10000,10000\nAuthorization:Bearer ${token}\n\n\x00`
                        : `CONNECT\naccept-version:1.2\nheart-beat:10000,10000\n\n\x00`;
                    this.socket.send(connectFrame);
                    this.connectionHandlers.onOpen.forEach(h => { try { h(event); } catch(e) {} });
                    resolve(this.socket);
                };

                this.socket.onclose = (event) => {
                    this.connected = false;
                    this.connectionHandlers.onClose.forEach(h => { try { h(event); } catch(e) {} });
                    if (this.reconnectAttempts === 0) { this._attemptReconnect(); }
                };

                this.socket.onerror = (event) => {
                    this.connectionHandlers.onError.forEach(h => { try { h(event); } catch(e) {} });
                    reject(new Error('WebSocket连接错误'));
                };

                this.socket.onmessage = (event) => {
                    this._handleRawMessage(event.data);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    _handleRawMessage(data) {
        if (typeof data !== 'string') return;

        // 处理 CONNECTED 帧
        if (data.startsWith('CONNECTED')) { return; }
        // 处理心跳
        if (data === '\n' || data === '') { return; }

        // 解析 STOMP 帧
        const firstNull = data.indexOf('\x00');
        if (firstNull < 0) return;
        const frameBody = data.substring(0, firstNull);

        // 尝试提取消息体 JSON
        const jsonStart = frameBody.indexOf('{');
        if (jsonStart < 0) return;

        try {
            const message = JSON.parse(frameBody.substring(jsonStart));
            const headerEnd = frameBody.indexOf('\n\n');
            let destination = '';
            if (headerEnd > 0) {
                const headers = frameBody.substring(0, headerEnd);
                const destMatch = headers.match(/destination:(.+)/);
                if (destMatch) { destination = destMatch[1].trim(); }
            }

            // 根据 destination 路由
            if (destination.includes('/topic/public')) {
                const type = message.type || 'CHAT';
                this._dispatch(type, message);
            } else if (destination.includes('/queue/webrtc/signal')) {
                const type = message.type || 'signal';
                this._dispatch(type, message);
            } else if (destination.includes('/queue/messages')) {
                this._dispatch('CHAT', message);
            } else {
                const type = message.type || 'unknown';
                this._dispatch(type, message);
            }
        } catch (e) {
            console.error('解析STOMP消息失败:', e, data.substring(0, 100));
        }
    }

    _dispatch(type, message) {
        if (type && this.messageHandlers[type]) {
            this.messageHandlers[type].forEach(h => { try { h(message); } catch(e) { console.error('handler error:', e); } });
        }
    }

    _attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => { this.connect().catch(() => {}); }, this.reconnectInterval);
        }
    }

    // 发送 STOMP SEND 帧
    _sendFrame(destination, body) {
        if (!this.connected || !this.socket) { return false; }
        try {
            const bodyStr = JSON.stringify(body);
            const frame = `SEND\ndestination:${destination}\ncontent-type:application/json\n\n${bodyStr}\x00`;
            this.socket.send(frame);
            return true;
        } catch (error) {
            console.error('发送失败:', error);
            return false;
        }
    }

    // 发送 STOMP SUBSCRIBE 帧
    _subscribe(destination, id) {
        if (!this.connected || !this.socket) { return; }
        const frame = `SUBSCRIBE\nid:${id}\ndestination:${destination}\n\n\x00`;
        this.socket.send(frame);
    }

    // 公共发送接口
    send(message) {
        let destination = '/app/chat';
        if (message.destination) {
            destination = message.destination;
            delete message.destination;
        }
        return this._sendFrame(destination, message);
    }

    sendChatMessage(content, receiver = null) {
        return this._sendFrame('/app/chat', {
            type: 'CHAT',
            content: content,
            sender: currentUser ? currentUser.username : 'anonymous',
            receiver: receiver,
            timestamp: new Date().toISOString()
        });
    }

    sendCallRequest(targetUserId) {
        return this._sendFrame('/app/webrtc/call', { targetUserId: targetUserId });
    }

    sendAnswer(targetUserId, sdpData) {
        return this._sendFrame('/app/webrtc/answer', { to: targetUserId, data: sdpData });
    }

    sendIceCandidate(targetUserId, candidate) {
        return this._sendFrame('/app/webrtc/ice-candidate', { to: targetUserId, data: candidate });
    }

    sendHangup(targetUserId) {
        return this._sendFrame('/app/webrtc/hangup', { to: targetUserId });
    }

    // 订阅主题
    subscribe(destination, handler) {
        const id = 'sub-' + (++this._subId);
        this._subscriptions[id] = destination;
        this._subscribe(destination, id);
    }

    addMessageHandler(type, handler) {
        if (!this.messageHandlers[type]) { this.messageHandlers[type] = []; }
        this.messageHandlers[type].push(handler);
    }

    addConnectionHandler(event, handler) {
        const key = 'on' + event.charAt(0).toUpperCase() + event.slice(1);
        if (this.connectionHandlers[key]) { this.connectionHandlers[key].push(handler); }
    }

    disconnect() {
        if (this.socket) {
            this.connected = false;
            this.reconnectAttempts = this.maxReconnectAttempts + 1;
            try { this.socket.send('DISCONNECT\n\n\x00'); } catch(e) {}
            this.socket.close();
            this.socket = null;
        }
    }
}
