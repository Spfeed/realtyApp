package com.realty_app.auth_service.dto;

import com.realty_app.auth_service.model.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminUserResponse {
    private Long id;
    private String email;
    private Role role;
    private LocalDateTime createdAt;
}
