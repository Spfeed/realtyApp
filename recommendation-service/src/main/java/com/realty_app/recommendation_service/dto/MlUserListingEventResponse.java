package com.realty_app.recommendation_service.dto;

import com.realty_app.recommendation_service.model.UserListingEventType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MlUserListingEventResponse {
    private Long userId;
    private Long listingId;
    private UserListingEventType eventType;
    private Double eventWeight;
    private LocalDateTime createdAt;
}

