package com.realty_app.recommendation_service.kafka;

import com.realty_app.recommendation_service.dto.ApplicationCreatedEvent;
import com.realty_app.recommendation_service.model.UserListingEventType;
import com.realty_app.recommendation_service.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ApplicationEventConsumer {
    private final RecommendationService recommendationService;

    @KafkaListener(
            topics = "application-created",
            groupId = "recommendation-service",
            containerFactory = "applicationCreatedKafkaListenerContainerFactory"
    )
    public void handleApplicationCreated(ApplicationCreatedEvent event) {
        recommendationService.saveEvent(
                event.getApplicantId(),
                event.getListingId(),
                UserListingEventType.APPLICATION
        );
    }
}
