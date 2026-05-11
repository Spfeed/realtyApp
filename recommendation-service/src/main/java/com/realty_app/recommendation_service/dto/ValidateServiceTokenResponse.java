package com.realty_app.recommendation_service.dto;

import lombok.Data;

@Data
public class ValidateServiceTokenResponse {
    private boolean valid;
    private String serviceName;
    private String type;
}
