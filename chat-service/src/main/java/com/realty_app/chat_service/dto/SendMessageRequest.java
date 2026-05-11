package com.realty_app.chat_service.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SendMessageRequest {
    private Long conversationId;
    private String text;
}
