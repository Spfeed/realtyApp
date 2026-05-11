package com.realty_app.listing_service.dto;

import lombok.Data;

@Data
public class ValidateServiceTokenResponse {
    private boolean valid;
    private String serviceName;
    private String type;
}
