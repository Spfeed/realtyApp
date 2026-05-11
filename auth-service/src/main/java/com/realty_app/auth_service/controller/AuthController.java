package com.realty_app.auth_service.controller;

import com.realty_app.auth_service.dto.*;
import com.realty_app.auth_service.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/validate")
    public ValidateTokenResponse validate(@Valid @RequestBody ValidateTokenRequest request) {
        return authService.validateToken(request);
    }

    @PostMapping("/service-token")
    public ServiceTokenResponse serviceToken(@Valid @RequestBody ServiceTokenRequest request) {
        return authService.generateServiceToken(request);
    }

    @PostMapping("/validate-service")
    public ValidateServiceTokenResponse validateService(@Valid @RequestBody ValidateTokenRequest request) {
        return authService.validateServiceToken(request);
    }
}
