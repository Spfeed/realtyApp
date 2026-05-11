package com.realty_app.auth_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ValidateTokenResponse {

    private boolean valid;
    private Long userId;
    private String email;
    private String role;
}
