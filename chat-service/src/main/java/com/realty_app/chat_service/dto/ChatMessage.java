package com.realty_app.chat_service.dto;

import lombok.Data;

@Data
public class ChatMessage {
    private Long conversationId;
    private Long senderId;
    private String text;
}
