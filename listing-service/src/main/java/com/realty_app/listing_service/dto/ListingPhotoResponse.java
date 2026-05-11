package com.realty_app.listing_service.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ListingPhotoResponse {
    private Long id;
    private Long listingId;
    private String url;
    private Integer sortOrder;
    private Boolean isMain;
}
