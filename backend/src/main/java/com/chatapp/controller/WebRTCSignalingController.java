package com.chatapp.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.chatapp.config.WebRTCConfig;
import com.chatapp.model.WebRTCSignal;

import lombok.extern.slf4j.Slf4j;

/**
 * WebRTC信令控制器
 * 负责处理WebRTC通信过程中的各类信令，包括：
 * - 配置获取
 * - 呼叫建立
 * - 应答处理
 * - ICE候选交换
 * - 通话状态管理
 */
@Controller
@Slf4j
public class WebRTCSignalingController {

    /**
     * 消息发送模板，用于向特定用户发送WebSocket消息
     */
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    /**
     * WebRTC配置信息，包含ICE服务器和视频参数配置
     */
    @Autowired
    private WebRTCConfig webRTCConfig;
    
    /**
     * 处理获取ICE服务器配置的请求
     * 当客户端需要建立WebRTC连接时，首先需要获取ICE服务器配置
     * @param accessor 消息头访问器，用于获取会话ID
     */
    @MessageMapping("/webrtc/config")
    public void getWebRTCConfig(SimpMessageHeaderAccessor accessor) {
        String sessionId = accessor.getSessionId();
        log.info("用户请求WebRTC配置: {}", sessionId);
        
        messagingTemplate.convertAndSendToUser(
            sessionId, 
            "/queue/webrtc/config", 
            webRTCConfig
        );
    }
    
    /**
     * 处理呼叫请求
     * 当用户A想要与用户B建立视频通话时，发送呼叫请求
     * @param payload 包含目标用户ID的请求数据
     * @param accessor 消息头访问器，用于获取发起呼叫的用户会话ID
     */
    @MessageMapping("/webrtc/call")
    public void call(@Payload Map<String, String> payload, SimpMessageHeaderAccessor accessor) {
        String from = accessor.getUser() != null ? accessor.getUser().getName() : accessor.getSessionId();
        String to = payload.get("to");
        
        log.info("用户 {} 呼叫用户 {}", from, to);
        
        WebRTCSignal signal = new WebRTCSignal();
        signal.setType("call");
        signal.setFrom(from);
        signal.setData(webRTCConfig.getVideo() != null ? webRTCConfig.getVideo() : new com.chatapp.config.WebRTCConfig.VideoConfig());
        
        messagingTemplate.convertAndSendToUser(
            to,
            "/queue/webrtc/signal",
            signal
        );
    }
    
    /**
     * 处理应答请求
     * 当被呼叫方接受通话请求时，发送应答信令
     * @param signal 包含应答信息的信令对象
     * @param accessor 消息头访问器，用于获取应答用户的会话ID
     */
    @MessageMapping("/webrtc/answer")
    public void answer(@Payload WebRTCSignal signal, SimpMessageHeaderAccessor accessor) {
        String from = accessor.getSessionId();
        String to = signal.getTo();
        
        log.info("用户 {} 应答用户 {}", from, to);
        
        signal.setFrom(from);
        signal.setType("answer");
        
        messagingTemplate.convertAndSendToUser(
            to,
            "/queue/webrtc/signal",
            signal
        );
    }
    
    /**
     * 处理ICE候选交换
     * 在WebRTC连接建立过程中，交换网络连接信息
     * @param signal 包含ICE候选信息的信令对象
     * @param accessor 消息头访问器，用于获取发送候选信息的用户会话ID
     */
    @MessageMapping("/webrtc/ice-candidate")
    public void iceCandidate(@Payload WebRTCSignal signal, SimpMessageHeaderAccessor accessor) {
        String from = accessor.getSessionId();
        String to = signal.getTo();
        
        log.debug("用户 {} 发送ICE候选到用户 {}", from, to);
        
        signal.setFrom(from);
        signal.setType("ice-candidate");
        
        messagingTemplate.convertAndSendToUser(
            to,
            "/queue/webrtc/signal",
            signal
        );
    }
    
    /**
     * 处理带宽调整请求
     * 根据网络状况动态调整视频比特率，优化通话质量
     * @param signal 包含带宽调整参数的信令对象
     * @param accessor 消息头访问器，用于获取请求用户的会话ID
     */
    @MessageMapping("/webrtc/adjust-bitrate")
    public void adjustBitrate(@Payload WebRTCSignal signal, SimpMessageHeaderAccessor accessor) {
        String from = accessor.getSessionId();
        String to = signal.getTo();
        
        log.info("用户 {} 请求调整带宽: {}", from, signal.getData());
        
        signal.setFrom(from);
        signal.setType("adjust-bitrate");
        
        messagingTemplate.convertAndSendToUser(
            to,
            "/queue/webrtc/signal",
            signal
        );
    }
    
    /**
     * 处理挂断请求
     * 当用户结束通话时，发送挂断信令给对方
     * @param payload 包含目标用户ID的请求数据
     * @param accessor 消息头访问器，用于获取发起挂断的用户会话ID
     */
    @MessageMapping("/webrtc/hangup")
    public void hangup(@Payload Map<String, String> payload, SimpMessageHeaderAccessor accessor) {
        String from = accessor.getSessionId();
        String to = payload.get("to");
        
        log.info("用户 {} 挂断与用户 {} 的通话", from, to);
        
        WebRTCSignal signal = new WebRTCSignal();
        signal.setType("hangup");
        signal.setFrom(from);
        
        messagingTemplate.convertAndSendToUser(
            to,
            "/queue/webrtc/signal",
            signal
        );
    }
}