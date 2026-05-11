package com.realty_app.review_service.kafka;

import com.realty_app.review_service.dto.ReviewEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ReviewEventProducer {
    private static final String REVIEW_CREATED_TOPIC = "review-created";
    private static final String REVIEW_UPDATED_TOPIC = "review-updated";
    private static final String REVIEW_DELETED_TOPIC = "review-deleted";

    private final KafkaTemplate<String, Object> kafkaTemplate;


    public void sendReviewCreated(ReviewEvent event) {
        kafkaTemplate.send(
                REVIEW_CREATED_TOPIC,
                event.getReviewId().toString(),
                event
        );
    }

    public void sendReviewUpdated(ReviewEvent event) {
        kafkaTemplate.send(REVIEW_UPDATED_TOPIC, event.getReviewId().toString(), event);
    }

    public void sendReviewDeleted(ReviewEvent event) {
        kafkaTemplate.send(REVIEW_DELETED_TOPIC, event.getReviewId().toString(), event);
    }
}
