package com.realty_app.chat_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationCreatedEvent {
    private Long applicationId;
    private Long conversationId;
}
