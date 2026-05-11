package com.realty_app.listing_service.dto;

import com.realty_app.listing_service.model.ListingStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ListingResponse {
    private Long id;
    private String title;
    private String description;
    private BigDecimal area;
    private BigDecimal price;
    private Boolean utilitiesIncluded;
    private BigDecimal depositAmount;
    private Long ownerId;

    private Long cityId;
    private String cityName;

    private Long districtId;
    private String districtName;

    private String street;
    private String houseNumber;

    private List<String> livingRules;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private ListingStatus status;

    private String rejectionReason;

    private Integer floor;
    private Boolean hasElevator;

    private BigDecimal latitude;
    private BigDecimal longitude;
}
