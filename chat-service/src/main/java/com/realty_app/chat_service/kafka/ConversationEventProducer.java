package com.realty_app.chat_service.kafka;

import com.realty_app.chat_service.event.ConversationCreatedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ConversationEventProducer {
    private static final String TOPIC = "conversation-created";

    private final KafkaTemplate<String, ConversationCreatedEvent> kafkaTemplate;

    public void sendConversationCreated(ConversationCreatedEvent event) {
        kafkaTemplate.send(
                TOPIC,
                event.getApplicationId().toString(),
                event
        );
    }
}
