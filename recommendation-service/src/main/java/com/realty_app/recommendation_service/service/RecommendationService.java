package com.realty_app.recommendation_service.service;

import com.realty_app.recommendation_service.client.MlServiceClient;
import com.realty_app.recommendation_service.dto.MlRecommendationResponse;
import com.realty_app.recommendation_service.dto.MlUserListingEventResponse;
import com.realty_app.recommendation_service.model.UserListingEvent;
import com.realty_app.recommendation_service.model.UserListingEventType;
import com.realty_app.recommendation_service.repository.UserListingEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecommendationService {
    private final UserListingEventRepository eventRepository;
    private final MlServiceClient mlServiceClient;

    public UserListingEvent saveEvent(
            Long userId,
            Long listingId,
            UserListingEventType eventType
    ) {

        if (isWeakEvent(eventType)) {
            LocalDateTime threshold = LocalDateTime.now().minusDays(1);

            boolean alreadyExists = eventRepository
                    .existsByUserIdAndListingIdAndEventTypeAndCreatedAtAfter(
                            userId,
                            listingId,
                            eventType,
                            threshold
                    );

            if (alreadyExists) {
                return null;
            }
        }

        if (isUniqueEvent(eventType)) {
            boolean alreadyExists = eventRepository.existsByUserIdAndListingIdAndEventType(
                    userId,
                    listingId,
                    eventType
            );

            if (alreadyExists) {
                return null;
            }
        }

        UserListingEvent event = UserListingEvent.builder()
                .userId(userId)
                .listingId(listingId)
                .eventType(eventType)
                .eventWeight(resolveWeight(eventType))
                .build();

        return eventRepository.save(event);
    }

    public UserListingEvent saveEvent(
            Long userId,
            Long listingId,
            UserListingEventType eventType,
            Double customWeight
    ) {
        UserListingEvent event = UserListingEvent.builder()
                .userId(userId)
                .listingId(listingId)
                .eventType(eventType)
                .eventWeight(customWeight != null ? customWeight : resolveWeight(eventType))
                .build();

        return eventRepository.save(event);
    }

    public List<MlUserListingEventResponse> getAllEventsForMl() {
        return eventRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toMlResponse)
                .toList();
    }

    public List<MlUserListingEventResponse> getUserEventsForMl(Long userId) {
        return eventRepository.findByUserId(userId)
                .stream()
                .map(this::toMlResponse)
                .toList();
    }

    public List<MlRecommendationResponse> getMyRecommendations(Long userId, int limit) {
        List<MlRecommendationResponse> recommendations =
                mlServiceClient.getHybridRecommendations(userId, limit);

        return recommendations != null ? recommendations : List.of();
    }

    public UserListingEvent saveOrUpdateReviewEvent(
            Long reviewId,
            Long userId,
            Long listingId,
            Double weight
    ) {
        UserListingEvent event = eventRepository
                .findByEventTypeAndSourceEventId(UserListingEventType.REVIEW, reviewId)
                .orElseGet(() -> UserListingEvent.builder()
                        .eventType(UserListingEventType.REVIEW)
                        .sourceEventId(reviewId)
                        .build());

        event.setUserId(userId);
        event.setListingId(listingId);
        event.setEventWeight(weight);

        return eventRepository.save(event);
    }

    @Transactional
    public void deleteReviewEvent(Long reviewId) {
        eventRepository.deleteByEventTypeAndSourceEventId(
                UserListingEventType.REVIEW,
                reviewId
        );
    }

    private MlUserListingEventResponse toMlResponse(UserListingEvent event) {
        return MlUserListingEventResponse.builder()
                .userId(event.getUserId())
                .listingId(event.getListingId())
                .eventType(event.getEventType())
                .eventWeight(event.getEventWeight())
                .createdAt(event.getCreatedAt())
                .build();
    }

    private double resolveWeight(UserListingEventType eventType) {
        return switch (eventType) {
            case VIEW -> 1.0;
            case VIEW_PHOTOS -> 1.5;
            case VIEW_MAP -> 1.3;
            case VIEW_NEARBY -> 1.2;
            case CONTACT_OWNER -> 3.0;
            case APPLICATION -> 6.0;
            case REVIEW -> 5.0;
            case HIDE -> -4.0;
        };
    }

    private boolean isWeakEvent(UserListingEventType eventType) {
        return switch (eventType) {
            case VIEW, VIEW_PHOTOS, VIEW_MAP, VIEW_NEARBY -> true;
            case CONTACT_OWNER, APPLICATION, REVIEW, HIDE -> false;
        };
    }
    private boolean isUniqueEvent(UserListingEventType eventType) {
        return switch (eventType) {
            case CONTACT_OWNER, APPLICATION, HIDE -> true;
            case VIEW, VIEW_PHOTOS, VIEW_MAP, VIEW_NEARBY, REVIEW -> false;
        };
    }

}
