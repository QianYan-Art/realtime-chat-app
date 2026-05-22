package com.chatapp.model;

import lombok.Data;

@Data
public class ChatMessage {
    private String type;      // CHAT, JOIN, LEAVE
    private String sender;    // 发送者用户名
    private String content;   // 消息内容
    private String receiver;  // 接收者（可选，null 表示广播）
    private String timestamp; // ISO 时间戳
}
