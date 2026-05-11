package com.realty_app.listing_service.dto.reference;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReferenceNameRequest {
    @NotBlank
    private String name;
}
