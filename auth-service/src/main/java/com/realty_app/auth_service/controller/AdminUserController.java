package com.realty_app.auth_service.controller;

import com.realty_app.auth_service.dto.AdminUserResponse;
import com.realty_app.auth_service.dto.UpdateUserRoleRequest;
import com.realty_app.auth_service.security.UserPrincipal;
import com.realty_app.auth_service.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/auth/admin/users")
@RequiredArgsConstructor
public class AdminUserController {
    private final AdminUserService adminUserService;

    @PatchMapping("/{userId}/role")
    public AdminUserResponse updateRole(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserRoleRequest request,
            Authentication authentication
    ) {

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return adminUserService.updateRole(userId, principal.getUserId(), request);
    }

    @GetMapping
    public List<AdminUserResponse> getAllUsers() {
        return adminUserService.getAllUsers();
    }
}
