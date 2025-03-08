/**
 * WebRTC处理器
 * 负责管理视频通话的媒体流和连接
 */
class WebRTCHandler {
    constructor() {
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.isAudioEnabled = true;
        this.isVideoEnabled = true;
        
        // 媒体约束
        this.mediaConstraints = CONFIG.VIDEO_CONSTRAINTS;
    }

    /**
     * 初始化本地媒体流
     * @returns {Promise<MediaStream>} 本地媒体流
     */
    async initializeLocalStream() {
        try {
            console.log('正在请求媒体设备权限...');
            this.localStream = await navigator.mediaDevices.getUserMedia(this.mediaConstraints);
            
            console.log('已获取本地媒体流:', this.localStream);
            console.log('音频轨道:', this.localStream.getAudioTracks());
            console.log('视频轨道:', this.localStream.getVideoTracks());
            
            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.srcObject = this.localStream;
                console.log('本地视频元素已设置媒体流');
            } else {
                console.error('找不到本地视频元素');
            }
            
            return this.localStream;
        } catch (error) {
            console.error('获取本地媒体流失败:', error);
            throw error;
        }
    }

    /**
     * 创建对等连接
     * @returns {Promise<RTCPeerConnection>} 对等连接
     */
    async createPeerConnection() {
        try {
            console.log('创建对等连接...');
            console.log('使用ICE服务器:', CONFIG.ICE_SERVERS);
            
            this.peerConnection = new RTCPeerConnection({
                iceServers: CONFIG.ICE_SERVERS,
                bundlePolicy: 'max-bundle',
                rtcpMuxPolicy: 'require'
            });

            console.log('对等连接已创建:', this.peerConnection);

            // 添加本地媒体轨道到对等连接
            if (this.localStream) {
                console.log('添加本地媒体轨道到对等连接...');
                this.localStream.getTracks().forEach(track => {
                    this.peerConnection.addTrack(track, this.localStream);
                    console.log(`已添加轨道: ${track.kind}`);
                });
            } else {
                console.warn('本地媒体流不存在，无法添加轨道');
            }

            // 处理远程媒体流
            this.peerConnection.ontrack = (event) => {
                console.log('收到远程轨道:', event.track.kind);
                const remoteVideo = document.getElementById('remoteVideo');
                if (remoteVideo && remoteVideo.srcObject !== event.streams[0]) {
                    console.log('设置远程视频元素媒体流');
                    remoteVideo.srcObject = event.streams[0];
                    this.remoteStream = event.streams[0];
                }
            };

            // 处理ICE候选
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('生成ICE候选:', event.candidate);
                    // 在实际应用中，这里会发送ICE候选到对方
                }
            };
            
            // 处理ICE连接状态变化
            this.peerConnection.oniceconnectionstatechange = () => {
                console.log('ICE连接状态变化:', this.peerConnection.iceConnectionState);
            };

            return this.peerConnection;
        } catch (error) {
            console.error('创建对等连接失败:', error);
            throw error;
        }
    }

    /**
     * 创建并发送offer
     * @returns {Promise<RTCSessionDescription>} offer
     */
    async createOffer() {
        if (!this.peerConnection) {
            console.log('对等连接不存在，创建新的对等连接');
            await this.createPeerConnection();
        }

        try {
            console.log('创建offer...');
            const offer = await this.peerConnection.createOffer();
            console.log('offer已创建:', offer);
            
            console.log('设置本地描述...');
            await this.peerConnection.setLocalDescription(offer);
            console.log('本地描述已设置');
            
            console.log('创建offer成功');
            return offer;
        } catch (error) {
            console.error('创建offer失败:', error);
            throw error;
        }
    }

    /**
     * 处理answer
     * @param {RTCSessionDescription} answer 远程answer
     */
    async handleAnswer(answer) {
        try {
            if (!this.peerConnection) {
                console.log('对等连接不存在，创建新的对等连接');
                await this.createPeerConnection();
            }
            
            console.log('收到answer:', answer);
            console.log('设置远程描述...');
            
            const rtcSessionDescription = new RTCSessionDescription(answer);
            await this.peerConnection.setRemoteDescription(rtcSessionDescription);
            
            console.log('远程描述已设置');
        } catch (error) {
            console.error('处理answer失败:', error);
            throw error;
        }
    }

    /**
     * 处理ICE候选
     * @param {RTCIceCandidate} candidate ICE候选
     */
    async handleIceCandidate(candidate) {
        try {
            if (this.peerConnection) {
                console.log('收到ICE候选:', candidate);
                console.log('添加ICE候选...');
                
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                
                console.log('ICE候选已添加');
            } else {
                console.warn('对等连接不存在，无法添加ICE候选');
            }
        } catch (error) {
            console.error('处理ICE候选失败:', error);
            throw error;
        }
    }

    /**
     * 切换音频状态
     * @returns {boolean} 切换后的状态
     */
    toggleAudio() {
        if (this.localStream) {
            const audioTracks = this.localStream.getAudioTracks();
            if (audioTracks.length > 0) {
                this.isAudioEnabled = !this.isAudioEnabled;
                audioTracks.forEach(track => {
                    track.enabled = this.isAudioEnabled;
                    console.log(`音频轨道 ${track.id} 已${this.isAudioEnabled ? '启用' : '禁用'}`);
                });
                return this.isAudioEnabled;
            } else {
                console.warn('没有音频轨道可切换');
            }
        } else {
            console.warn('本地媒体流不存在，无法切换音频');
        }
        return false;
    }

    /**
     * 切换视频状态
     * @returns {boolean} 切换后的状态
     */
    toggleVideo() {
        if (this.localStream) {
            const videoTracks = this.localStream.getVideoTracks();
            if (videoTracks.length > 0) {
                this.isVideoEnabled = !this.isVideoEnabled;
                videoTracks.forEach(track => {
                    track.enabled = this.isVideoEnabled;
                    console.log(`视频轨道 ${track.id} 已${this.isVideoEnabled ? '启用' : '禁用'}`);
                });
                return this.isVideoEnabled;
            } else {
                console.warn('没有视频轨道可切换');
            }
        } else {
            console.warn('本地媒体流不存在，无法切换视频');
        }
        return false;
    }

    /**
     * 清理资源
     */
    cleanup() {
        console.log('清理WebRTC资源...');
        
        if (this.localStream) {
            console.log('停止本地媒体流轨道...');
            this.localStream.getTracks().forEach(track => {
                track.stop();
                console.log(`轨道 ${track.id} 已停止`);
            });
            this.localStream = null;
        }

        if (this.peerConnection) {
            console.log('关闭对等连接...');
            this.peerConnection.close();
            this.peerConnection = null;
        }

        const localVideo = document.getElementById('localVideo');
        const remoteVideo = document.getElementById('remoteVideo');
        
        if (localVideo) {
            console.log('清除本地视频元素媒体流');
            localVideo.srcObject = null;
        }
        
        if (remoteVideo) {
            console.log('清除远程视频元素媒体流');
            remoteVideo.srcObject = null;
        }
        
        console.log('WebRTC资源清理完成');
    }
} 