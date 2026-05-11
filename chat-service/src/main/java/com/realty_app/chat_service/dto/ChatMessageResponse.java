package com.realty_app.chat_service.dto;

import com.realty_app.chat_service.model.MessageStatus;
import com.realty_app.chat_service.model.MessageType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatMessageResponse {
    private Long id;
    private Long conversationId;
    private Long senderId;
    private String text;
    private LocalDateTime createdAt;
    private MessageStatus status;
    private MessageType type;
}
