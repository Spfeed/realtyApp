package com.realty_app.application_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationCreatedEvent {
    private Long applicationId;
    private Long listingId;
    private Long ownerId;
    private Long applicantId;
}
