package com.realty_app.application_service.kafka;

import com.realty_app.application_service.event.ConversationCreatedEvent;
import com.realty_app.application_service.model.RentalApplication;
import com.realty_app.application_service.repository.RentalApplicationRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ConversationCreatedConsumer {
    private final RentalApplicationRepository applicationRepository;

    @Transactional
    @KafkaListener(topics = "conversation-created", groupId = "application-service")
    public void handle(ConversationCreatedEvent event) {
        RentalApplication application = applicationRepository.findById(event.getApplicationId())
                .orElseThrow(() -> new RuntimeException("Заявка не найдена: " + event.getApplicationId()));

        application.setConversationId(event.getConversationId());

        applicationRepository.save(application);

        System.out.println(
                "Диалог " + event.getConversationId()
                + " создан по заявке " + event.getApplicationId()
        );
    }
}
