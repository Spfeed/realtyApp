package com.realty_app.application_service.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateApplicationRequest {
    @NotNull
    private Long listingId;
}
