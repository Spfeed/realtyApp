package com.realty_app.listing_service.security;

import com.realty_app.listing_service.dto.ValidateServiceTokenResponse;
import com.realty_app.listing_service.dto.ValidateTokenResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final RestTemplate restTemplate;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        if (tryAuthenticateUserToken(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (tryAuthenticateServiceToken(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        SecurityContextHolder.clearContext();
        filterChain.doFilter(request, response);
    }

    private boolean tryAuthenticateUserToken(String token) {
        try {
            ValidateTokenResponse response = restTemplate.postForObject(
                    "http://auth-service/auth/validate",
                    Map.of("token", token),
                    ValidateTokenResponse.class
            );

            if (response == null || !response.isValid()) {
                return false;
            }

            UserPrincipal principal = new UserPrincipal(
                    response.getUserId(),
                    response.getEmail(),
                    response.getRole()
            );

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            principal,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + response.getRole()))
                    );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            return true;

        } catch (Exception e) {
            return false;
        }
    }

    private boolean tryAuthenticateServiceToken(String token) {
        try {
            ValidateServiceTokenResponse response = restTemplate.postForObject(
                    "http://auth-service/auth/validate-service",
                    Map.of("token", token),
                    ValidateServiceTokenResponse.class
            );

            if (response == null || !response.isValid()) {
                return false;
            }

            ServicePrincipal principal = new ServicePrincipal(response.getServiceName());

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            principal,
                            null,
                            List.of(
                                    new SimpleGrantedAuthority("ROLE_SERVICE"),
                                    new SimpleGrantedAuthority("SERVICE_" + response.getServiceName())
                            )
                    );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            return true;

        } catch (Exception e) {
            return false;
        }
    }
}