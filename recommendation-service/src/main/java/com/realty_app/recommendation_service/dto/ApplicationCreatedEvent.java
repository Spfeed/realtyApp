package com.realty_app.recommendation_service.dto;

import lombok.Data;

@Data
public class ApplicationCreatedEvent {
    private Long applicationId;
    private Long listingId;
    private Long ownerId;
    private Long applicantId;
}
