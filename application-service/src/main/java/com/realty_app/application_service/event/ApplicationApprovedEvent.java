package com.realty_app.application_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationApprovedEvent {
    private Long applicationId;
    private Long listingId;
    private Long ownerId;
    private Long applicantId;
}
