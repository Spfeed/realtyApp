package com.realty_app.chat_service.dto;

import com.realty_app.chat_service.model.MessageType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ConversationPreviewResponse {
    private Long id;
    private Long listingId;

    private Long participant1Id;
    private Long participant2Id;

    private LocalDateTime createdAt;

    private String lastMessageText;
    private Long lastMessageSenderId;
    private LocalDateTime lastMessageCreatedAt;

    private Long unreadCount;

    private MessageType lastMessageType;
}
