let currentUser = null;
let stompClient = null;
let webrtcHandler = null;
let localVideoStarted = false;
let userManagementModal = null;

// 页面管理
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    document.getElementById(pageId).style.display = 'block';
}

// 显示聊天区域
function showChatSection() {
    document.getElementById('chatSection').classList.remove('hidden');
    document.getElementById('videoSection').classList.add('hidden');
    
    // 更新菜单项状态
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('.menu-item:nth-child(1)').classList.add('active');
}

// 显示视频区域
function showVideoSection() {
    document.getElementById('chatSection').classList.add('hidden');
    document.getElementById('videoSection').classList.remove('hidden');
    
    // 更新菜单项状态
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('.menu-item:nth-child(2)').classList.add('active');
}

// WebSocket连接 - 简化版，不使用SockJS
function connectWebSocket() {
    try {
        console.log('尝试连接WebSocket...');
        // 直接使用模拟数据，不实际连接WebSocket
        console.log('WebSocket连接成功（模拟）');
    } catch (error) {
        console.error('WebSocket连接失败:', error);
    }
}

// 订阅消息主题 - 模拟版
function subscribeToMessages() {
    console.log('已订阅消息主题（模拟）');
}

// 添加消息到聊天窗口
function appendMessage(message) {
    const messageList = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    
    // 格式化时间
    const timestamp = new Date(message.timestamp);
    const timeString = timestamp.toLocaleTimeString();
    
    // 如果是当前用户发送的消息，添加特殊样式
    if (message.sender === currentUser.username) {
        messageElement.classList.add('message-self');
    } else {
        messageElement.classList.add('message-other');
    }
    
    // 创建消息内容
    messageElement.innerHTML = `
        <div class="message-header">
            <span class="message-sender">${message.sender}</span>
            <span class="message-time">${timeString}</span>
        </div>
        <div class="message-content">${message.content}</div>
    `;
    
    messageList.appendChild(messageElement);
    
    // 滚动到最新消息
    messageList.scrollTop = messageList.scrollHeight;
}

/**
 * 显示登录错误信息
 * @param {string} message - 错误信息
 */
function showLoginError(message) {
    const errorElement = document.getElementById('loginError');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // 3秒后自动隐藏错误信息
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 3000);
}

/**
 * 验证用户登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Object|null} 用户对象或null（如果验证失败）
 */
function validateUser(username, password) {
    // 检查是否是允许的用户
    for (const key in ALLOWED_USERS) {
        const user = ALLOWED_USERS[key];
        if (user.username === username && user.password === password) {
            return {
                username: user.username,
                displayName: user.displayName,
                roles: ['USER']
            };
        }
    }
    return null;
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
        // 验证用户
        const user = validateUser(username, password);
        
        if (!user) {
            showLoginError('用户名或密码错误，或者您不是允许的用户');
            return;
        }
        
        // 设置当前用户
        currentUser = user;
        
        // 更新用户显示名称
        document.getElementById('currentUserName').textContent = user.displayName || user.username;
        
        // 显示聊天页面
        showPage('chatPage');
        
        // 连接WebSocket
        connectWebSocket();
        
        // 订阅消息
        subscribeToMessages();
        
        console.log('登录成功:', user.username);
    } catch (error) {
        console.error('登录处理错误:', error);
        showLoginError('登录过程中发生错误，请重试');
    }
}

// 登出处理
function handleLogout() {
    // 断开WebSocket连接
    if (stompClient && stompClient.connected) {
        stompClient.disconnect();
    }
    
    // 清除当前用户信息
    currentUser = null;
    
    // 返回登录页面
    showPage('loginPage');
    
    console.log('已登出');
}

// 初始化用户凭据管理模态框
function initUserManagement() {
    // 初始化Bootstrap模态框
    userManagementModal = new bootstrap.Modal(document.getElementById('userManagementModal'));
    
    // 打开模态框时填充当前用户数据
    document.getElementById('userManagementModal').addEventListener('show.bs.modal', function () {
        document.getElementById('user1Username').value = ALLOWED_USERS.user1.username;
        document.getElementById('user1Password').value = ALLOWED_USERS.user1.password;
        document.getElementById('user2Username').value = ALLOWED_USERS.user2.username;
        document.getElementById('user2Password').value = ALLOWED_USERS.user2.password;
    });
    
    // 保存用户1设置
    document.getElementById('saveUser1Button').addEventListener('click', function() {
        const username = document.getElementById('user1Username').value;
        const password = document.getElementById('user1Password').value;
        
        if (!username || !password) {
            alert('用户名和密码不能为空');
            return;
        }
        
        updateUserCredentials('user1', {
            username: username,
            password: password
        });
        
        alert('用户1凭据已更新');
    });
    
    // 保存用户2设置
    document.getElementById('saveUser2Button').addEventListener('click', function() {
        const username = document.getElementById('user2Username').value;
        const password = document.getElementById('user2Password').value;
        
        if (!username || !password) {
            alert('用户名和密码不能为空');
            return;
        }
        
        updateUserCredentials('user2', {
            username: username,
            password: password
        });
        
        alert('用户2凭据已更新');
    });
    
    // 打开用户管理模态框
    document.getElementById('manageUsersButton').addEventListener('click', function() {
        userManagementModal.show();
    });
}

// 开始本地视频
async function startLocalVideo() {
    if (localVideoStarted) return;
    
    try {
        // 初始化WebRTC处理器
        webrtcHandler = new WebRTCHandler();
        await webrtcHandler.initializeLocalStream();
        
        // 更新UI状态
        localVideoStarted = true;
        document.getElementById('startVideoButton').disabled = true;
        document.getElementById('toggleAudioButton').disabled = false;
        document.getElementById('toggleVideoButton').disabled = false;
        document.getElementById('hangupButton').disabled = false;
        
        // 显示本地视频
        const localVideo = document.getElementById('localVideo');
        if (webrtcHandler.localStream) {
            localVideo.srcObject = webrtcHandler.localStream;
        }
        
        // 显示视频容器，但不切换页面
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
    
    // 音频控制
    audioToggle.addEventListener('click', toggleAudio);
    minimizedAudioToggle.addEventListener('click', toggleAudio);
    
    // 视频控制
    videoToggle.addEventListener('click', toggleVideo);
    minimizedVideoToggle.addEventListener('click', toggleVideo);
    
    // 挂断控制
    hangupButton.addEventListener('click', endCall);
    minimizedHangupButton.addEventListener('click', endCall);
    
    // 最小化视频窗口
    minimizeButton.addEventListener('click', () => {
        document.querySelector('.video-container').style.display = 'none';
        document.getElementById('minimizedVideoBar').style.display = 'block';
    });
    
    // 恢复视频窗口
    expandButton.addEventListener('click', () => {
        document.querySelector('.video-container').style.display = 'flex';
        document.getElementById('minimizedVideoBar').style.display = 'none';
    });
    
    // 音频切换函数
    function toggleAudio() {
        if (webrtcHandler) {
            const isEnabled = webrtcHandler.toggleAudio();
            // 更新两个界面的按钮图标
            const audioIcon = isEnabled ? 'fa-microphone' : 'fa-microphone-slash';
            audioToggle.innerHTML = `<i class="fas ${audioIcon}"></i>`;
            minimizedAudioToggle.innerHTML = `<i class="fas ${audioIcon}"></i>`;
        }
    }
    
    // 视频切换函数
    function toggleVideo() {
        if (webrtcHandler) {
            const isEnabled = webrtcHandler.toggleVideo();
            // 更新两个界面的按钮图标
            const videoIcon = isEnabled ? 'fa-video' : 'fa-video-slash';
            videoToggle.innerHTML = `<i class="fas ${videoIcon}"></i>`;
            minimizedVideoToggle.innerHTML = `<i class="fas ${videoIcon}"></i>`;
        }
    }
    
    // 结束通话函数
    function endCall() {
        if (webrtcHandler) {
            webrtcHandler.cleanup();
            
            // 重置状态
            localVideoStarted = false;
            document.getElementById('startVideoButton').disabled = false;
            document.getElementById('toggleAudioButton').disabled = true;
            document.getElementById('toggleVideoButton').disabled = true;
            document.getElementById('hangupButton').disabled = true;
            
            // 重置按钮文本
            audioToggle.innerHTML = '<i class="fas fa-microphone"></i>';
            videoToggle.innerHTML = '<i class="fas fa-video"></i>';
            
            // 隐藏视频容器和最小化栏
            document.querySelector('.video-container').style.display = 'none';
            document.getElementById('minimizedVideoBar').style.display = 'none';
        }
    }
    
    // 使视频容器可拖动
    makeVideoDraggable();
}

// 使视频容器可拖动
function makeVideoDraggable() {
    const videoContainer = document.querySelector('.video-container');
    const videoHeader = document.querySelector('.video-header');
    
    let isDragging = false;
    let offsetX, offsetY;
    
    // 鼠标按下时开始拖动
    videoHeader.addEventListener('mousedown', (e) => {
        // 只有当点击的是视频头部区域而不是其中的按钮时才允许拖动
        if (e.target === videoHeader || e.target.tagName === 'H3') {
            isDragging = true;
            
            // 计算鼠标在容器内的偏移量
            const rect = videoContainer.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            // 设置容器为绝对定位，以便移动
            videoContainer.style.position = 'absolute';
            videoContainer.style.margin = '0';
            
            // 防止选中文本
            e.preventDefault();
        }
    });
    
    // 鼠标移动时更新位置
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            videoContainer.style.left = `${e.clientX - offsetX}px`;
            videoContainer.style.top = `${e.clientY - offsetY}px`;
        }
    });
    
    // 鼠标释放时结束拖动
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    // 鼠标离开窗口时结束拖动
    document.addEventListener('mouseleave', () => {
        isDragging = false;
    });
}

// 发送消息
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();
    
    if (!content) {
        return;
    }
    
    try {
        // 创建消息对象
        const message = {
            sender: currentUser.username,
            content: content,
            timestamp: new Date().toISOString()
        };
        
        // 直接在本地显示消息（模拟发送）
        appendMessage(message);
        
        // 清空输入框
        messageInput.value = '';
        
        // 滚动到最新消息
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        console.error('发送消息失败:', error);
        alert('发送消息失败: ' + error.message);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化用户凭据管理
    initUserManagement();
    
    // 登录按钮点击事件
    document.getElementById('loginButton').addEventListener('click', handleLogin);
    
    // 登出按钮点击事件
    document.getElementById('logoutButton').addEventListener('click', handleLogout);
    
    // 回车键登录
    document.getElementById('password').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            handleLogin();
        }
    });
    
    // 添加发送消息按钮事件监听
    document.getElementById('sendButton').addEventListener('click', sendMessage);
    
    // 添加消息输入框回车键事件监听
    document.getElementById('messageInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });
    
    // 初始化视频通话控制
    initializeVideoControls();
    
    // 添加开始视频按钮事件监听
    document.getElementById('startVideoButton').addEventListener('click', () => {
        startLocalVideo();
    });
    
    // 添加返回聊天按钮事件监听
    document.getElementById('backToChatButton').addEventListener('click', () => {
        // 隐藏视频容器而不是切换页面
        document.querySelector('.video-container').style.display = 'none';
        
        // 如果视频通话仍在进行，显示最小化栏
        if (localVideoStarted) {
            document.getElementById('minimizedVideoBar').style.display = 'block';
        }
    });
}); 