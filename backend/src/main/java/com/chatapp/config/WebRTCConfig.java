package com.chatapp.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

/**
 * WebRTC配置类
 * 用于管理WebRTC相关的配置参数，包括ICE服务器和视频编码配置
 */
@Configuration
@ConfigurationProperties(prefix = "webrtc")
@Data
public class WebRTCConfig {
    
    /**
     * ICE服务器列表配置
     * 用于NAT穿透和建立点对点连接
     */
    private List<IceServer> iceServers;

    /**
     * 视频相关配置
     * 包括编解码、分辨率、帧率等参数
     */
    private VideoConfig video;
    
    /**
     * ICE服务器配置类
     * 包含STUN/TURN服务器的URL和认证信息
     */
    @Data
    public static class IceServer {
        /**
         * 服务器URL，支持stun:或turn:协议
         */
        private String urls;

        /**
         * TURN服务器的用户名（可选）
         */
        private String username;

        /**
         * TURN服务器的密码凭证（可选）
         */
        private String credential;
    }
    
    /**
     * 视频配置类
     * 用于设置视频通话的各项参数
     */
    @Data
    public static class VideoConfig {
        /**
         * 视频编解码器，如VP8、H.264等
         */
        private String codec;

        /**
         * 视频宽度（像素）
         */
        private int width;

        /**
         * 视频高度（像素）
         */
        private int height;

        /**
         * 视频帧率（fps）
         */
        private int framerate;

        /**
         * 目标视频比特率（bps）
         */
        private int bitrate;

        /**
         * 最小视频比特率（bps）
         * 用于网络条件较差时的自适应调整
         */
        private int minBitrate;

        /**
         * 最大视频比特率（bps）
         * 用于网络条件较好时的自适应调整
         */
        private int maxBitrate;
    }
}