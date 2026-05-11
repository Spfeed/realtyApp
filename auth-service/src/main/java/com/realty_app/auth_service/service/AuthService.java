package com.realty_app.auth_service.service;

import com.realty_app.auth_service.dto.*;
import com.realty_app.auth_service.model.AuthUser;
import com.realty_app.auth_service.model.Role;
import com.realty_app.auth_service.repository.AuthUserRepository;
import com.realty_app.auth_service.security.JwtService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthUserRepository authUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {
        if (authUserRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Пользователь с таким email уже существует!");
        }

        AuthUser authUser = AuthUser.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .build();

        authUserRepository.save(authUser);

        String token = jwtService.generateToken(authUser);

        return new AuthResponse(token);
    }

    public AuthResponse login(LoginRequest request) {
        AuthUser user = authUserRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Неверный email!"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Неверный пароль!");
        }

        String token = jwtService.generateToken(user);

        return new AuthResponse(token);
    }

    public ValidateTokenResponse validateToken(ValidateTokenRequest request) {
        String token = request.getToken();

        if (!jwtService.isTokenValid(token)) {
            return new ValidateTokenResponse(false, null, null, null);
        }

        Claims claims = jwtService.extractClaims(token);

        Long userId = claims.get("userId", Long.class);
        String email = claims.getSubject();
        String role = claims.get("role", String.class);

        return new ValidateTokenResponse(true, userId, email, role);
    }

    public ServiceTokenResponse generateServiceToken(ServiceTokenRequest request) {
        String token = jwtService.generateServiceToken(request.getServiceName());
        return new ServiceTokenResponse(token);
    }

    public ValidateServiceTokenResponse validateServiceToken(ValidateTokenRequest request) {
        String token = request.getToken();

        if (!jwtService.isServiceTokenValid(token)) {
            return new ValidateServiceTokenResponse(false, null, null);
        }

        Claims claims = jwtService.extractClaims(token);

        String serviceName = claims.get("serviceName", String.class);
        String type = claims.get("type", String.class);

        return new ValidateServiceTokenResponse(true, serviceName, type);
    }

}
