package com.chatapp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket配置类
 * 用于配置WebSocket服务器的各项参数，包括端点、消息代理、跨域设置等
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * WebSocket端点路径，从配置文件中读取
     */
    @Value("${websocket.endpoint}")
    private String websocketEndpoint;

    /**
     * 允许的跨域来源，从配置文件中读取
     */
    @Value("${websocket.allowed-origins}")
    private String allowedOrigins;

    /**
     * 注册STOMP协议的端点
     * 这些端点将用于WebSocket连接的建立
     * @param registry 端点注册器
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint(websocketEndpoint)
                .setAllowedOrigins(allowedOrigins) // 设置允许的跨域来源
                .withSockJS(); // 启用SockJS支持，用于不支持WebSocket的浏览器
    }

    /**
     * 配置消息代理
     * 用于设置消息的路由规则和目标前缀
     * @param registry 消息代理注册器
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app"); // 设置客户端发送消息的前缀
        registry.enableSimpleBroker("/topic", "/queue"); // 启用简单消息代理，支持点对点和广播消息
        registry.setUserDestinationPrefix("/user"); // 设置用户目标前缀，用于点对点消息
    }
}