package com.realty_app.auth_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ValidateServiceTokenResponse {
    private boolean valid;
    private String serviceName;
    private String type;
}
