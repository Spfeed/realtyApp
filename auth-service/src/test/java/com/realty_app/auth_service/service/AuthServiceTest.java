package com.realty_app.auth_service.service;

import com.realty_app.auth_service.dto.*;
import com.realty_app.auth_service.model.AuthUser;
import com.realty_app.auth_service.model.Role;
import com.realty_app.auth_service.repository.AuthUserRepository;
import com.realty_app.auth_service.security.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthUserRepository authUserRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    @Test
    void register_shouldCreateUserAndReturnToken() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("user@mail.com");
        request.setPassword("123456");

        when(authUserRepository.existsByEmail("user@mail.com")).thenReturn(false);
        when(passwordEncoder.encode("123456")).thenReturn("encodedPassword");
        when(jwtService.generateToken(any(AuthUser.class))).thenReturn("jwt-token");

        AuthResponse response = authService.register(request);

        assertEquals("jwt-token", response.getToken());

        ArgumentCaptor<AuthUser> captor = ArgumentCaptor.forClass(AuthUser.class);
        verify(authUserRepository).save(captor.capture());

        AuthUser savedUser = captor.getValue();

        assertEquals("user@mail.com", savedUser.getEmail());
        assertEquals("encodedPassword", savedUser.getPasswordHash());
        assertEquals(Role.USER, savedUser.getRole());

        verify(jwtService).generateToken(savedUser);
    }

    @Test
    void register_shouldThrowException_whenEmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("user@mail.com");
        request.setPassword("123456");

        when(authUserRepository.existsByEmail("user@mail.com")).thenReturn(true);

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> authService.register(request)
        );

        assertEquals("Пользователь с таким email уже существует!", exception.getMessage());

        verify(authUserRepository, never()).save(any());
        verify(jwtService, never()).generateToken(any());
    }

    @Test
    void login_shouldReturnToken_whenCredentialsAreValid() {
        LoginRequest request = new LoginRequest();
        request.setEmail("user@mail.com");
        request.setPassword("123456");

        AuthUser user = AuthUser.builder()
                .id(1L)
                .email("user@mail.com")
                .passwordHash("encodedPassword")
                .role(Role.USER)
                .build();

        when(authUserRepository.findByEmail("user@mail.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("123456", "encodedPassword")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("jwt-token");

        AuthResponse response = authService.login(request);

        assertEquals("jwt-token", response.getToken());

        verify(authUserRepository).findByEmail("user@mail.com");
        verify(passwordEncoder).matches("123456", "encodedPassword");
        verify(jwtService).generateToken(user);
    }

    @Test
    void login_shouldThrowException_whenEmailIsInvalid() {
        LoginRequest request = new LoginRequest();
        request.setEmail("wrong@mail.com");
        request.setPassword("123456");

        when(authUserRepository.findByEmail("wrong@mail.com")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> authService.login(request)
        );

        assertEquals("Неверный email!", exception.getMessage());

        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(jwtService, never()).generateToken(any());
    }

    @Test
    void login_shouldThrowException_whenPasswordIsInvalid() {
        LoginRequest request = new LoginRequest();
        request.setEmail("user@mail.com");
        request.setPassword("wrongPassword");

        AuthUser user = AuthUser.builder()
                .id(1L)
                .email("user@mail.com")
                .passwordHash("encodedPassword")
                .role(Role.USER)
                .build();

        when(authUserRepository.findByEmail("user@mail.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPassword", "encodedPassword")).thenReturn(false);

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> authService.login(request)
        );

        assertEquals("Неверный пароль!", exception.getMessage());

        verify(jwtService, never()).generateToken(any());
    }

    @Test
    void validateToken_shouldReturnValidResponse_whenTokenIsValid() {
        ValidateTokenRequest request = new ValidateTokenRequest();
        request.setToken("valid-token");

        Claims claims = Jwts.claims()
                .subject("user@mail.com")
                .add("userId", 1L)
                .add("role", "USER")
                .build();

        when(jwtService.isTokenValid("valid-token")).thenReturn(true);
        when(jwtService.extractClaims("valid-token")).thenReturn(claims);

        ValidateTokenResponse response = authService.validateToken(request);

        assertTrue(response.isValid());
        assertEquals(1L, response.getUserId());
        assertEquals("user@mail.com", response.getEmail());
        assertEquals("USER", response.getRole());
    }

    @Test
    void validateToken_shouldReturnInvalidResponse_whenTokenIsInvalid() {
        ValidateTokenRequest request = new ValidateTokenRequest();
        request.setToken("invalid-token");

        when(jwtService.isTokenValid("invalid-token")).thenReturn(false);

        ValidateTokenResponse response = authService.validateToken(request);

        assertFalse(response.isValid());
        assertNull(response.getUserId());
        assertNull(response.getEmail());
        assertNull(response.getRole());

        verify(jwtService, never()).extractClaims(anyString());
    }
}