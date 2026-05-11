package com.realty_app.auth_service.dto;

import com.realty_app.auth_service.model.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateUserRoleRequest {
    @NotNull
    private Role role;
}
