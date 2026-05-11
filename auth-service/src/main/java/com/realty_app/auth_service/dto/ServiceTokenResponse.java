package com.realty_app.auth_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ServiceTokenResponse {
    private String token;
}
