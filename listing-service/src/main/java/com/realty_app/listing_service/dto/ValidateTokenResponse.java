package com.realty_app.listing_service.dto;

import lombok.Data;

@Data
public class ValidateTokenResponse {
    private boolean valid;
    private Long userId;
    private String email;
    private String role;
}
