package com.realty_app.listing_service.event;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationApprovedEvent {
    private Long applicationId;
    private Long listingId;
    private Long ownerId;
    private Long applicantId;
}
