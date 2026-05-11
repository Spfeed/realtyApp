package com.realty_app.listing_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RejectListingRequest {
    @NotBlank
    private String reason;
}
