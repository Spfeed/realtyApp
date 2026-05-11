package com.realty_app.recommendation_service.repository;

import com.realty_app.recommendation_service.model.UserListingEvent;
import com.realty_app.recommendation_service.model.UserListingEventType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserListingEventRepository extends JpaRepository<UserListingEvent, Long> {
    List<UserListingEvent> findByUserId(Long userId);

    List<UserListingEvent> findAllByOrderByCreatedAtDesc();

    Optional<UserListingEvent> findByEventTypeAndSourceEventId(
            UserListingEventType eventType,
            Long sourceEventId
    );

    void deleteByEventTypeAndSourceEventId(
            UserListingEventType eventType,
            Long sourceEventId
    );

    boolean existsByUserIdAndListingIdAndEventTypeAndCreatedAtAfter(
            Long userId,
            Long listingId,
            UserListingEventType eventType,
            LocalDateTime createdAt
    );

    boolean existsByUserIdAndListingIdAndEventType(
            Long userId,
            Long listingId,
            UserListingEventType eventType
    );
}
