package com.realty_app.listing_service.dto.geo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GeoCoordinates {
    private BigDecimal latitude;
    private BigDecimal longitude;
}
