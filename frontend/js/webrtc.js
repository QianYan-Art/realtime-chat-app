class WebRTCHandler {
    constructor() {
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.isAudioEnabled = true;
        this.isVideoEnabled = true;
        this.mediaConstraints = CONFIG.VIDEO_CONSTRAINTS;
    }

    async initializeLocalStream() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia(this.mediaConstraints);
            const localVideo = document.getElementById('localVideo');
            if (localVideo) { localVideo.srcObject = this.localStream; }
            return this.localStream;
        } catch (error) {
            console.error('获取本地媒体流失败:', error);
            throw error;
        }
    }

    async createPeerConnection() {
        try {
            this.peerConnection = new RTCPeerConnection({ iceServers: CONFIG.ICE_SERVERS });

            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    this.peerConnection.addTrack(track, this.localStream);
                });
            }

            this.peerConnection.ontrack = (event) => {
                const remoteVideo = document.getElementById('remoteVideo');
                if (remoteVideo && remoteVideo.srcObject !== event.streams[0]) {
                    remoteVideo.srcObject = event.streams[0];
                    this.remoteStream = event.streams[0];
                }
            };

            // ICE 候选通过信令服务器转发
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate && window.wsHandler && window.wsHandler.connected) {
                    window.wsHandler.send({
                        type: 'ICE_CANDIDIDATE',
                        targetUserId: window.__remoteUser || '',
                        data: event.candidate.toJSON ? event.candidate.toJSON() : event.candidate
                    });
                }
            };

            this.peerConnection.oniceconnectionstatechange = () => {
                console.log('ICE连接状态:', this.peerConnection.iceConnectionState);
            };

            return this.peerConnection;
        } catch (error) {
            console.error('创建对等连接失败:', error);
            throw error;
        }
    }

    // 创建 offer 并通过信令服务器发送
    async createAndSendOffer(targetUserId) {
        if (!this.peerConnection) { await this.createPeerConnection(); }
        try {
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            if (window.wsHandler && window.wsHandler.connected) {
                window.wsHandler.send({
                    type: 'CALL_REQUEST',
                    targetUserId: targetUserId,
                    data: { type: 'offer', sdp: offer.sdp }
                });
            }
            return offer;
        } catch (error) {
            console.error('创建offer失败:', error);
            throw error;
        }
    }

    // 处理远程 answer
    async handleAnswer(answer) {
        try {
            if (!this.peerConnection) { await this.peerConnection(); }
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
            console.error('处理answer失败:', error);
            throw error;
        }
    }

    // 处理远程 ICE 候选
    async handleIceCandidate(candidate) {
        try {
            if (this.peerConnection) {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (error) {
            console.error('处理ICE候选失败:', error);
            throw error;
        }
    }

    toggleAudio() {
        if (this.localStream) {
            const tracks = this.localStream.getAudioTracks();
            if (tracks.length > 0) {
                this.isAudioEnabled = !this.isAudioEnabled;
                tracks.forEach(t => { t.enabled = this.isAudioEnabled; });
                return this.isAudioEnabled;
            }
        }
        return false;
    }

    toggleVideo() {
        if (this.localStream) {
            const tracks = this.localStream.getVideoTracks();
            if (tracks.length > 0) {
                this.isVideoEnabled = !this.isVideoEnabled;
                tracks.forEach(t => { t.enabled = this.isVideoEnabled; });
                return this.isVideoEnabled;
            }
        }
        return false;
    }

    cleanup() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(t => t.stop());
            this.localStream = null;
        }
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        const lv = document.getElementById('localVideo');
        const rv = document.getElementById('remoteVideo');
        if (lv) { lv.srcObject = null; }
        if (rv) { rv.srcObject = null; }
    }
}
