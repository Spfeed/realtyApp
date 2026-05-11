package com.realty_app.auth_service.service;

import com.realty_app.auth_service.dto.AdminUserResponse;
import com.realty_app.auth_service.dto.UpdateUserRoleRequest;
import com.realty_app.auth_service.model.AuthUser;
import com.realty_app.auth_service.repository.AuthUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserService {
    private final AuthUserRepository authUserRepository;

    public AdminUserResponse updateRole(Long userId, Long currentAdminId, UpdateUserRoleRequest request) {

        if (userId.equals(currentAdminId)) {
            throw new RuntimeException("Нельзя изменить собственную роль");
        }

        AuthUser user = authUserRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        user.setRole(request.getRole());

        AuthUser saved = authUserRepository.save(user);

        return toResponse(saved);
    }

    public List<AdminUserResponse> getAllUsers() {
        return authUserRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private AdminUserResponse toResponse(AuthUser user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
