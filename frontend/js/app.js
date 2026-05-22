let currentUser = null;
let stompClient = null;
let wsHandler = null;

let webrtcHandler = null;
let localVideoStarted = false;
let userManagementModal = null;
let apiHandler = null;

// 页面管理
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    document.getElementById(pageId).style.display = 'block';
}

// WebSocket连接
function connectWebSocket() {
    try {
        wsHandler = new WebSocketHandler();
        window.wsHandler = wsHandler;

        // 注册消息处理器
        wsHandler.addMessageHandler('CHAT', function(message) {
            appendMessage({
                sender: message.sender || '未知用户',
                content: message.content,
                timestamp: message.timestamp || new Date().toISOString()
            });
        });

        wsHandler.addMessageHandler('JOIN', function(message) {
            appendMessage({
                sender: '系统',
                content: message.content || (message.sender + ' 加入了聊天室'),
                timestamp: message.timestamp || new Date().toISOString()
            });
        });

        wsHandler.addMessageHandler('LEAVE', function(message) {
            appendMessage({
                sender: '系统',
                content: message.content || (message.sender + ' 离开了聊天室'),
                timestamp: message.timestamp || new Date().toISOString()
            });
        });

        // WebRTC 信令消息
        wsHandler.addMessageHandler('call', function(signal) {
            console.log('收到通话请求 from:', signal.from);
            if (webrtcHandler && signal.data) {
                webrtcHandler.createPeerConnection().then(function() {
                    return webrtcHandler.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.data));
                }).then(function() {
                    return webrtcHandler.peerConnection.createAnswer();
                }).then(function(answer) {
                    webrtcHandler.peerConnection.setLocalDescription(answer);
                    wsHandler.sendAnswer(signal.from, { type: 'answer', sdp: answer.sdp });
                }).catch(function(e) { console.error('处理通话请求失败:', e); });
            }
        });

        wsHandler.addMessageHandler('answer', function(signal) {
            console.log('收到应答 from:', signal.from);
            if (webrtcHandler && webrtcHandler.peerConnection && signal.data) {
                webrtcHandler.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.data))
                    .catch(function(e) { console.error('设置远程描述失败:', e); });
            }
        });

        wsHandler.addMessageHandler('ice-candidate', function(signal) {
            console.log('收到ICE候选 from:', signal.from);
            if (webrtcHandler && webrtcHandler.peerConnection && signal.data) {
                webrtcHandler.peerConnection.addIceCandidate(new RTCIceCandidate(signal.data))
                    .catch(function(e) { console.error('添加ICE候选失败:', e); });
            }
        });

        wsHandler.addMessageHandler('hangup', function(signal) {
            console.log('对方挂断:', signal.from);
            if (webrtcHandler) {
                webrtcHandler.cleanup();
                localVideoStarted = false;
                document.getElementById('startVideoButton').disabled = false;
                document.getElementById('toggleAudioButton').disabled = true;
                document.getElementById('toggleVideoButton').disabled = true;
                document.getElementById('hangupButton').disabled = true;
                document.querySelector('.video-container').style.display = 'none';
                document.getElementById('minimizedVideoBar').style.display = 'none';
            }
        });

        // 连接WebSocket服务器
        wsHandler.connect()
            .then(function() {
                console.log('WebSocket连接成功');
                subscribeToMessages();
            })
            .catch(function(error) {
                console.error('WebSocket连接失败:', error);
            });
    } catch (error) {
        console.error('WebSocket连接失败:', error);
    }
}

// 订阅消息主题和 WebRTC 信令
function subscribeToMessages() {
    if (wsHandler && wsHandler.connected) {
        wsHandler.subscribe('/topic/public');
        wsHandler.subscribe('/user/queue/webrtc/signal');
        wsHandler.subscribe('/user/queue/messages');
        // 发送 join 消息
        wsHandler._sendFrame('/app/join', {});
        console.log('已订阅消息主题');
    }
}

// HTML转义 - 防止XSS攻击
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 添加消息到聊天窗口
function appendMessage(message) {
    const messageList = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');

    const timestamp = new Date(message.timestamp);
    const timeString = timestamp.toLocaleTimeString();

    if (message.sender === currentUser.username) {
        messageElement.classList.add('message-self');
    } else {
        messageElement.classList.add('message-other');
    }

    messageElement.innerHTML = `
        <div class="message-header">
            <span class="message-sender">${escapeHtml(message.sender)}</span>
            <span class="message-time">${timeString}</span>
        </div>
        <div class="message-content">${escapeHtml(message.content)}</div>
    `;

    messageList.appendChild(messageElement);
    messageList.scrollTop = messageList.scrollHeight;
}

function showLoginError(message) {
    const errorElement = document.getElementById('loginError');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => { errorElement.style.display = 'none'; }, 3000);
}

// 登录处理
async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showLoginError('请输入用户名和密码');
        return;
    }

    try {
        if (!apiHandler) { apiHandler = new ApiHandler(); }
        const response = await apiHandler.login(username, password);

        if (!response || !response.token) {
            showLoginError('用户名或密码错误');
            return;
        }

        currentUser = {
            username: response.username || username,
            displayName: response.username || username,
            roles: ['USER']
        };

        document.getElementById('currentUserName').textContent = currentUser.username;
        showPage('chatPage');
        connectWebSocket();
        console.log('登录成功:', currentUser.username);
    } catch (error) {
        console.error('登录处理错误:', error);
        if (apiHandler) { apiHandler.clearToken(); }
        showLoginError('登录过程中发生错误，请重试');
    }
}

// 登出处理
function handleLogout() {
    if (wsHandler) { wsHandler.disconnect(); }
    currentUser = null;
    if (apiHandler) { apiHandler.clearToken(); }
    showPage('loginPage');
    console.log('已登出');
}

// 初始化用户凭据管理模态框
function initUserManagement() {
    userManagementModal = new bootstrap.Modal(document.getElementById('userManagementModal'));

    document.getElementById('userManagementModal').addEventListener('show.bs.modal', function () {
        document.getElementById('user1Username').value = ALLOWED_USERS.user1.username;
        document.getElementById('user1DisplayName').value = ALLOWED_USERS.user1.displayName;
        document.getElementById('user2Username').value = ALLOWED_USERS.user2.username;
        document.getElementById('user2DisplayName').value = ALLOWED_USERS.user2.displayName;
    });

    document.getElementById('saveUser1Button').addEventListener('click', function() {
        const u = document.getElementById('user1Username').value;
        const d = document.getElementById('user1DisplayName').value;
        if (!u || !d) { alert('用户名和显示名称不能为空'); return; }
        ALLOWED_USERS.user1.username = u;
        ALLOWED_USERS.user1.displayName = d;
        alert('用户1显示名称已更新');
    });

    document.getElementById('saveUser2Button').addEventListener('click', function() {
        const u = document.getElementById('user2Username').value;
        const d = document.getElementById('user2DisplayName').value;
        if (!u || !d) { alert('用户名和显示名称不能为空'); return; }
        ALLOWED_USERS.user2.username = u;
        ALLOWED_USERS.user2.displayName = d;
        alert('用户2显示名称已更新');
    });

    document.getElementById('manageUsersButton').addEventListener('click', function() {
        userManagementModal.show();
    });
}

// 开始本地视频
async function startLocalVideo() {
    if (localVideoStarted) return;
    try {
        webrtcHandler = new WebRTCHandler();
        await webrtcHandler.initializeLocalStream();
        localVideoStarted = true;
        document.getElementById('startVideoButton').disabled = true;
        document.getElementById('toggleAudioButton').disabled = false;
        document.getElementById('toggleVideoButton').disabled = false;
        document.getElementById('hangupButton').disabled = false;
        const localVideo = document.getElementById('localVideo');
        if (webrtcHandler.localStream) { localVideo.srcObject = webrtcHandler.localStream; }
        document.querySelector('.video-container').style.display = 'flex';
        document.querySelector('.video-container').style.position = 'fixed';
        document.querySelector('.video-container').style.zIndex = '1000';
        document.querySelector('.video-container').style.top = '50px';
        document.querySelector('.video-container').style.right = '50px';
        document.querySelector('.video-container').style.width = '400px';
        document.querySelector('.video-container').style.height = '300px';
        console.log('本地视频已启动');
    } catch (error) {
        console.error('启动本地视频失败:', error);
        alert('无法访问摄像头或麦克风: ' + error.message);
    }
}

// 初始化视频通话控制
function initializeVideoControls() {
    const audioToggle = document.getElementById('toggleAudioButton');
    const videoToggle = document.getElementById('toggleVideoButton');
    const hangupButton = document.getElementById('hangupButton');
    const minimizeButton = document.getElementById('minimizeVideoButton');
    const expandButton = document.getElementById('expandVideoButton');
    const minimizedAudioToggle = document.getElementById('minimizedToggleAudioButton');
    const minimizedVideoToggle = document.getElementById('minimizedToggleVideoButton');
    const minimizedHangupButton = document.getElementById('minimizedHangupButton');

    audioToggle.addEventListener('click', toggleAudio);
    minimizedAudioToggle.addEventListener('click', toggleAudio);
    videoToggle.addEventListener('click', toggleVideo);
    minimizedVideoToggle.addEventListener('click', toggleVideo);
    hangupButton.addEventListener('click', endCall);
    minimizedHangupButton.addEventListener('click', endCall);

    minimizeButton.addEventListener('click', () => {
        document.querySelector('.video-container').style.display = 'none';
        document.getElementById('minimizedVideoBar').style.display = 'block';
    });

    expandButton.addEventListener('click', () => {
        document.querySelector('.video-container').style.display = 'flex';
        document.getElementById('minimizedVideoBar').style.display = 'none';
    });

    function toggleAudio() {
        if (webrtcHandler) {
            const isEnabled = webrtcHandler.toggleAudio();
            const icon = isEnabled ? 'fa-microphone' : 'fa-microphone-slash';
            audioToggle.innerHTML = `<i class="fas ${icon}"></i>`;
            minimizedAudioToggle.innerHTML = `<i class="fas ${icon}"></i>`;
        }
    }

    function toggleVideo() {
        if (webrtcHandler) {
            const isEnabled = webrtcHandler.toggleVideo();
            const icon = isEnabled ? 'fa-video' : 'fa-video-slash';
            videoToggle.innerHTML = `<i class="fas ${icon}"></i>`;
            minimizedVideoToggle.innerHTML = `<i class="fas ${icon}"></i>`;
        }
    }

    function endCall() {
        if (webrtcHandler) {
            // 通知对方挂断
            if (wsHandler && wsHandler.connected) {
                wsHandler.send({ type: 'hangup', targetUserId: window.__remoteUser || '' });
            }
            webrtcHandler.cleanup();
            localVideoStarted = false;
            document.getElementById('startVideoButton').disabled = false;
            document.getElementById('toggleAudioButton').disabled = true;
            document.getElementById('toggleVideoButton').disabled = true;
            document.getElementById('hangupButton').disabled = true;
            audioToggle.innerHTML = '<i class="fas fa-microphone"></i>';
            videoToggle.innerHTML = '<i class="fas fa-video"></i>';
            document.querySelector('.video-container').style.display = 'none';
            document.getElementById('minimizedVideoBar').style.display = 'none';
        }
    }

    makeVideoDraggable();
}

function makeVideoDraggable() {
    const videoContainer = document.querySelector('.video-container');
    const videoHeader = document.querySelector('.video-header');
    let isDragging = false, offsetX, offsetY;

    videoHeader.addEventListener('mousedown', (e) => {
        if (e.target === videoHeader || e.target.tagName === 'H3') {
            isDragging = true;
            const rect = videoContainer.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            videoContainer.style.position = 'absolute';
            videoContainer.style.margin = '0';
            e.preventDefault();
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            videoContainer.style.left = `${e.clientX - offsetX}px`;
            videoContainer.style.top = `${e.clientY - offsetY}px`;
        }
    });

    document.addEventListener('mouseup', () => { isDragging = false; });
    document.addEventListener('mouseleave', () => { isDragging = false; });
}

// 发送消息
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();
    if (!content) return;

    try {
        if (wsHandler && wsHandler.connected) {
            // 通过 STOMP 发送到 /app/chat
            wsHandler.send({
                type: 'CHAT',
                content: content,
                sender: currentUser.username,
                timestamp: new Date().toISOString()
            });
        } else {
            appendMessage({ sender: currentUser.username, content: content, timestamp: new Date().toISOString() });
        }
        messageInput.value = '';
        document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
    } catch (error) {
        console.error('发送消息失败:', error);
        alert('发送消息失败: ' + error.message);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initUserManagement();
    document.getElementById('loginButton').addEventListener('click', handleLogin);
    document.getElementById('logoutButton').addEventListener('click', handleLogout);
    document.getElementById('password').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') { handleLogin(); }
    });
    document.getElementById('sendButton').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') { sendMessage(); }
    });
    initializeVideoControls();
    document.getElementById('startVideoButton').addEventListener('click', () => { startLocalVideo(); });
    document.getElementById('backToChatButton').addEventListener('click', () => {
        document.querySelector('.video-container').style.display = 'none';
        if (localVideoStarted) { document.getElementById('minimizedVideoBar').style.display = 'block'; }
    });
});
