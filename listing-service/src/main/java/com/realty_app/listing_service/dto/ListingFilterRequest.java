package com.realty_app.listing_service.dto;

import com.realty_app.listing_service.model.ListingStatus;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ListingFilterRequest {
    private Long cityId;
    private Long districtId;

    private BigDecimal minPrice;
    private BigDecimal maxPrice;

    private BigDecimal minArea;
    private BigDecimal maxArea;

    private Boolean utilitiesIncluded;

    private BigDecimal maxDepositAmount;

    private Integer minFloor;
    private Integer maxFloor;
    private Boolean hasElevator;

    private ListingStatus status;
}
