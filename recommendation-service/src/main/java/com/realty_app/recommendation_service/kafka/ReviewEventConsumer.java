package com.realty_app.recommendation_service.kafka;

import com.realty_app.recommendation_service.dto.ReviewEvent;
import com.realty_app.recommendation_service.model.UserListingEventType;
import com.realty_app.recommendation_service.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ReviewEventConsumer {
    private final RecommendationService recommendationService;

    @KafkaListener(
            topics = "review-created",
            groupId = "recommendation-service",
            containerFactory = "reviewEventKafkaListenerContainerFactory"
    )
    public void handleReviewCreated(ReviewEvent event) {
        recommendationService.saveOrUpdateReviewEvent(
                event.getReviewId(),
                event.getAuthorId(),
                event.getListingId(),
                resolveReviewWeight(event.getRating())
        );
    }

    @KafkaListener(
            topics = "review-updated",
            groupId = "recommendation-service",
            containerFactory = "reviewEventKafkaListenerContainerFactory"
    )
    public void handleReviewUpdated(ReviewEvent event) {
        recommendationService.saveOrUpdateReviewEvent(
                event.getReviewId(),
                event.getAuthorId(),
                event.getListingId(),
                resolveReviewWeight(event.getRating())
        );
    }

    @KafkaListener(
            topics = "review-deleted",
            groupId = "recommendation-service",
            containerFactory = "reviewEventKafkaListenerContainerFactory"
    )
    public void handleReviewDeleted(ReviewEvent event) {
        recommendationService.deleteReviewEvent(event.getReviewId());
    }

    private double resolveReviewWeight(Integer rating) {
        if (rating == null) return 3.0;

        return switch (rating) {
            case 1 -> 1.0;
            case 2 -> 2.0;
            case 3 -> 3.0;
            case 4 -> 5.0;
            case 5 -> 7.0;
            default -> 3.0;
        };
    }
}
