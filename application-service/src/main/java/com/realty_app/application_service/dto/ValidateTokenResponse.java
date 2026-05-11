package com.realty_app.application_service.dto;

import lombok.Data;

@Data
public class ValidateTokenResponse {
    private boolean valid;
    private Long userId;
    private String email;
    private String role;
}
