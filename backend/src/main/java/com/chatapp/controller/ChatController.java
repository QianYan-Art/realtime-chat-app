package com.chatapp.controller;

import com.chatapp.model.ChatMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@Slf4j
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat")
    public void handleChat(@Payload ChatMessage message, SimpMessageHeaderAccessor accessor) {
        String username = accessor.getUser() != null ? accessor.getUser().getName() : "anonymous";
        message.setSender(username);
        if (message.getTimestamp() == null) {
            message.setTimestamp(java.time.Instant.now().toString());
        }
        log.info("聊天消息 from {}: {}", username, message.getContent());

        if (message.getReceiver() != null && !message.getReceiver().isBlank()) {
            messagingTemplate.convertAndSendToUser(message.getReceiver(), "/queue/messages", message);
            messagingTemplate.convertAndSendToUser(username, "/queue/messages", message);
        } else {
            messagingTemplate.convertAndSend("/topic/public", message);
        }
    }

    @MessageMapping("/join")
    public void handleJoin(SimpMessageHeaderAccessor accessor) {
        String username = accessor.getUser() != null ? accessor.getUser().getName() : "anonymous";
        ChatMessage message = new ChatMessage();
        message.setType("JOIN");
        message.setSender("system");
        message.setContent(username + " 加入了聊天室");
        message.setTimestamp(java.time.Instant.now().toString());
        messagingTemplate.convertAndSend("/topic/public", message);
        log.info("用户加入: {}", username);
    }
}
