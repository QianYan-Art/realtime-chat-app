package com.chatapp.model;

import lombok.Data;

@Data
public class WebRTCSignal {
    private String type;    // 信令类型：call, answer, ice-candidate, hangup, adjust-bitrate
    private String from;    // 发送者的会话ID
    private String to;      // 接收者的会话ID
    private Object data;    // 信令数据，可能是SDP、ICE候选者或其他配置信息
}