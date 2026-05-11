package com.realty_app.application_service.kafka;

import com.realty_app.application_service.dto.ApplicationCreatedEvent;
import com.realty_app.application_service.event.ApplicationApprovedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ApplicationEventProducer {
    private static final String APPLICATION_CREATED_TOPIC = "application-created";
    private static final String APPLICATION_APPROVED_TOPIC = "application-approved";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendApplicationCreated(ApplicationCreatedEvent event) {
        kafkaTemplate.send(
                APPLICATION_CREATED_TOPIC,
                event.getApplicationId().toString(),
                event
        );
    }

    public void sendApplicationApproved(ApplicationApprovedEvent event) {
        kafkaTemplate.send(
                APPLICATION_APPROVED_TOPIC,
                event.getApplicationId().toString(),
                event
        );
    }
}
