package com.realty_app.listing_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class UpdateListingRequest {
    @NotBlank
    private String title;

    private String description;

    @NotNull
    @Positive
    private BigDecimal area;

    @NotNull
    @Positive
    private BigDecimal price;

    @NotNull
    private Boolean utilitiesIncluded;

    @NotNull
    @PositiveOrZero
    private BigDecimal depositAmount;

    @NotNull
    private Long cityId;

    private Long districtId;

    @NotBlank
    private String street;

    @NotBlank
    private String houseNumber;

    @Positive
    private Integer floor;

    @NotNull
    private Boolean hasElevator;

    private List<Long> livingRuleIds;
}