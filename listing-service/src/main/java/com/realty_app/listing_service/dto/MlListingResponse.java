package com.realty_app.listing_service.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class MlListingResponse {
    private Long id;

    private String title;
    private String description;

    private Long ownerId;

    private Long cityId;
    private Long districtId;

    private Double price;
    private Double area;

    private Integer floor;

    private Boolean hasElevator;
    private Boolean utilitiesIncluded;

    private Double depositAmount;

    private String status;

    private List<String> livingRules;
}
