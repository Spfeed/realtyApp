package com.realty_app.chat_service.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TypingRequest {
    private Long conversationId;
    private boolean typing;
}
