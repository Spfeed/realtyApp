package com.realty_app.recommendation_service.dto;

import com.realty_app.recommendation_service.model.UserListingEventType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class CreateUserListingEventRequest {
    @NotNull
    @Positive
    private Long listingId;

    @NotNull
    private UserListingEventType eventType;
}
