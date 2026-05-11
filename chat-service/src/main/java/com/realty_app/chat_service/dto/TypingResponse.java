package com.realty_app.chat_service.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TypingResponse {
    private Long conversationId;
    private Long userId;
    private boolean typing;
}
