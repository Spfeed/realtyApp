package com.realty_app.listing_service.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateListingRequest {
    @NotBlank
    private String title;

    private String description;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal area;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal price;

    @NotNull
    private Boolean utilitiesIncluded;

    @NotNull
    @DecimalMin("0.00")
    private BigDecimal depositAmount;

    @NotNull
    private Long cityId;

    private Long districtId;

    @NotBlank
    private String street;

    @NotBlank
    private String houseNumber;

    @Min(1)
    private Integer floor;

    @NotNull
    private Boolean hasElevator;

    private List<Long> livingRuleIds;
}
