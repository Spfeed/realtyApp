package com.realty_app.auth_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ServiceTokenRequest {
    @NotBlank
    private String serviceName;
}
