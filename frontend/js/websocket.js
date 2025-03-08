/**
 * WebSocket处理器
 * 负责管理WebSocket连接和消息处理
 */
class WebSocketHandler {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000; // 3秒
        this.messageHandlers = {};
        this.connectionHandlers = {
            onOpen: [],
            onClose: [],
            onError: []
        };
    }

    /**
     * 连接到WebSocket服务器
     * @param {string} url WebSocket服务器URL
     * @returns {Promise<WebSocket>} WebSocket连接
     */
    connect(url = CONFIG.WS_URL) {
        return new Promise((resolve, reject) => {
            try {
                console.log(`正在连接到WebSocket服务器: ${url}`);
                this.socket = new WebSocket(url);
                
                this.socket.onopen = (event) => {
                    console.log('WebSocket连接已建立');
                    this.connected = true;
                    this.reconnectAttempts = 0;
                    
                    // 触发所有onOpen处理器
                    this.connectionHandlers.onOpen.forEach(handler => {
                        try {
                            handler(event);
                        } catch (error) {
                            console.error('执行onOpen处理器时出错:', error);
                        }
                    });
                    
                    resolve(this.socket);
                };
                
                this.socket.onclose = (event) => {
                    console.log(`WebSocket连接已关闭: ${event.code} ${event.reason}`);
                    this.connected = false;
                    
                    // 触发所有onClose处理器
                    this.connectionHandlers.onClose.forEach(handler => {
                        try {
                            handler(event);
                        } catch (error) {
                            console.error('执行onClose处理器时出错:', error);
                        }
                    });
                    
                    // 尝试重新连接
                    this._attemptReconnect();
                };
                
                this.socket.onerror = (event) => {
                    console.error('WebSocket连接错误:', event);
                    
                    // 触发所有onError处理器
                    this.connectionHandlers.onError.forEach(handler => {
                        try {
                            handler(event);
                        } catch (error) {
                            console.error('执行onError处理器时出错:', error);
                        }
                    });
                    
                    reject(new Error('WebSocket连接错误'));
                };
                
                this.socket.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        console.log('收到WebSocket消息:', message);
                        
                        // 处理消息
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

    /**
     * 尝试重新连接
     * @private
     */
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

    /**
     * 处理接收到的消息
     * @param {Object} message 消息对象
     * @private
     */
    _handleMessage(message) {
        const { type } = message;
        
        if (type && this.messageHandlers[type]) {
            // 调用对应类型的消息处理器
            this.messageHandlers[type].forEach(handler => {
                try {
                    handler(message);
                } catch (error) {
                    console.error(`执行消息处理器(${type})时出错:`, error);
                }
            });
        } else {
            console.warn(`未找到消息类型(${type})的处理器`);
        }
    }

    /**
     * 发送消息
     * @param {Object} message 消息对象
     * @returns {boolean} 是否发送成功
     */
    send(message) {
        if (!this.connected || !this.socket) {
            console.error('WebSocket未连接，无法发送消息');
            return false;
        }
        
        try {
            const messageString = JSON.stringify(message);
            this.socket.send(messageString);
            console.log('已发送WebSocket消息:', message);
            return true;
        } catch (error) {
            console.error('发送WebSocket消息时出错:', error);
            return false;
        }
    }

    /**
     * 发送聊天消息
     * @param {string} content 消息内容
     * @param {string} receiver 接收者ID（可选，默认为广播）
     * @returns {boolean} 是否发送成功
     */
    sendChatMessage(content, receiver = null) {
        const message = {
            type: CONFIG.MESSAGE_TYPES.CHAT,
            content,
            timestamp: new Date().toISOString()
        };
        
        if (receiver) {
            message.receiver = receiver;
        }
        
        return this.send(message);
    }

    /**
     * 发送视频通话请求
     * @param {string} targetUserId 目标用户ID
     * @returns {boolean} 是否发送成功
     */
    sendCallRequest(targetUserId) {
        return this.send({
            type: CONFIG.MESSAGE_TYPES.CALL_REQUEST,
            targetUserId,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * 发送视频通话响应
     * @param {string} targetUserId 目标用户ID
     * @param {boolean} accepted 是否接受通话
     * @returns {boolean} 是否发送成功
     */
    sendCallResponse(targetUserId, accepted) {
        return this.send({
            type: CONFIG.MESSAGE_TYPES.CALL_RESPONSE,
            targetUserId,
            accepted,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * 发送WebRTC offer
     * @param {string} targetUserId 目标用户ID
     * @param {RTCSessionDescription} offer WebRTC offer
     * @returns {boolean} 是否发送成功
     */
    sendOffer(targetUserId, offer) {
        return this.send({
            type: CONFIG.MESSAGE_TYPES.OFFER,
            targetUserId,
            offer,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * 发送WebRTC answer
     * @param {string} targetUserId 目标用户ID
     * @param {RTCSessionDescription} answer WebRTC answer
     * @returns {boolean} 是否发送成功
     */
    sendAnswer(targetUserId, answer) {
        return this.send({
            type: CONFIG.MESSAGE_TYPES.ANSWER,
            targetUserId,
            answer,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * 发送ICE候选
     * @param {string} targetUserId 目标用户ID
     * @param {RTCIceCandidate} candidate ICE候选
     * @returns {boolean} 是否发送成功
     */
    sendIceCandidate(targetUserId, candidate) {
        return this.send({
            type: CONFIG.MESSAGE_TYPES.ICE_CANDIDATE,
            targetUserId,
            candidate,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * 添加消息处理器
     * @param {string} type 消息类型
     * @param {Function} handler 处理函数
     */
    addMessageHandler(type, handler) {
        if (!this.messageHandlers[type]) {
            this.messageHandlers[type] = [];
        }
        
        this.messageHandlers[type].push(handler);
        console.log(`已添加消息处理器: ${type}`);
    }

    /**
     * 添加连接事件处理器
     * @param {string} event 事件类型 ('open', 'close', 'error')
     * @param {Function} handler 处理函数
     */
    addConnectionHandler(event, handler) {
        const eventKey = `on${event.charAt(0).toUpperCase() + event.slice(1)}`;
        
        if (this.connectionHandlers[eventKey]) {
            this.connectionHandlers[eventKey].push(handler);
            console.log(`已添加连接事件处理器: ${eventKey}`);
        } else {
            console.warn(`未知的连接事件类型: ${event}`);
        }
    }

    /**
     * 关闭WebSocket连接
     */
    disconnect() {
        if (this.socket && this.connected) {
            console.log('正在关闭WebSocket连接...');
            this.socket.close();
            this.socket = null;
            this.connected = false;
        }
    }
} 