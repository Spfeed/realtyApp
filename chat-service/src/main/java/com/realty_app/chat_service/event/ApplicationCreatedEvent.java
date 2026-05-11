package com.realty_app.chat_service.event;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationCreatedEvent {
    private Long applicationId;
    private Long listingId;
    private Long ownerId;
    private Long applicantId;
}
