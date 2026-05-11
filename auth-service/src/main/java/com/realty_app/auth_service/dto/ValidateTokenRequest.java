package com.realty_app.auth_service.dto;

import lombok.Data;

@Data
public class ValidateTokenRequest {
    private String token;
}
