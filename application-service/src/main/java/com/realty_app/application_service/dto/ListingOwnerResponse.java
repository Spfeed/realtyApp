package com.realty_app.application_service.dto;

import lombok.Data;

@Data
public class ListingOwnerResponse {
    private Long listingId;
    private Long ownerId;
}
