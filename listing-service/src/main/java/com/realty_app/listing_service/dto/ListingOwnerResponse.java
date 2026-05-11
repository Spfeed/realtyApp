package com.realty_app.listing_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ListingOwnerResponse {
    private Long listingId;
    private Long ownerId;
}
