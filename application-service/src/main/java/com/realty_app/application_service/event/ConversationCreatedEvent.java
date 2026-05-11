package com.realty_app.application_service.event;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ConversationCreatedEvent {
    private Long applicationId;
    private Long conversationId;
}
