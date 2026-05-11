package com.realty_app.listing_service.dto.geo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NearbyPlaceResponse {
    private String name;
    private String category;
    private String osmType;
    private Long osmId;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer distanceMeters;
}
