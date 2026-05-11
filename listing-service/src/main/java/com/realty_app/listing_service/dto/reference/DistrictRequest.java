package com.realty_app.listing_service.dto.reference;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DistrictRequest {
    @NotNull
    private Long cityId;

    @NotBlank
    private String name;
}
