package com.realty_app.chat_service.kafka;

import com.realty_app.chat_service.dto.ChatMessageResponse;
import com.realty_app.chat_service.dto.ConversationPreviewResponse;
import com.realty_app.chat_service.event.ApplicationCreatedEvent;
import com.realty_app.chat_service.event.ConversationCreatedEvent;
import com.realty_app.chat_service.model.Conversation;
import com.realty_app.chat_service.model.Message;
import com.realty_app.chat_service.service.ConversationService;
import com.realty_app.chat_service.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ApplicationCreatedConsumer {
    private final ConversationService conversationService;
    private final ConversationEventProducer conversationEventProducer;
    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @KafkaListener(topics = "application-created", groupId = "chat-service")
    public void handle(ApplicationCreatedEvent event) {
        Conversation conversation = conversationService.getOrCreate(
                event.getListingId(),
                event.getOwnerId(),
                event.getApplicantId()
        );

        Message systemMessage = messageService.saveSystemMessage(
                conversation.getId(),
                event.getApplicantId(),
                "Пользователь отправил заявку на объявление #" + event.getListingId()
        );

        ChatMessageResponse messageResponse = ChatMessageResponse.builder()
                .id(systemMessage.getId())
                .conversationId(systemMessage.getConversationId())
                .senderId(systemMessage.getSenderId())
                .text(systemMessage.getText())
                .createdAt(systemMessage.getCreatedAt())
                .status(systemMessage.getStatus())
                .type(systemMessage.getType())
                .build();

        messagingTemplate.convertAndSend(
                "/topic/chat/" + conversation.getId(),
                messageResponse
        );

        ConversationPreviewResponse preview1 =
                conversationService.getPreviewForUser(conversation, conversation.getParticipant1Id());

        ConversationPreviewResponse preview2 =
                conversationService.getPreviewForUser(conversation, conversation.getParticipant2Id());

        messagingTemplate.convertAndSend(
                "/topic/chat-updates/" + conversation.getParticipant1Id(),
                preview1
        );

        messagingTemplate.convertAndSend(
                "/topic/chat-updates/" + conversation.getParticipant2Id(),
                preview2
        );

        conversationEventProducer.sendConversationCreated(
                ConversationCreatedEvent.builder()
                        .applicationId(event.getApplicationId())
                        .conversationId(conversation.getId())
                        .build()
        );

        System.out.println("Conversation created from Kafka event: " + conversation.getId());
    }
}