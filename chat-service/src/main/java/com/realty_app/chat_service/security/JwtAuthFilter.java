package com.realty_app.chat_service.security;

import com.realty_app.chat_service.dto.ValidateTokenResponse;
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
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
        throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if  (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        ValidateTokenResponse validateTokenResponse;

        try {
            validateTokenResponse = restTemplate.postForObject(
                    "http://auth-service/auth/validate",
                   Map.of("token", token),
                    ValidateTokenResponse.class
            );
        } catch (Exception e) {
            SecurityContextHolder.clearContext();
            filterChain.doFilter(request, response);
            return;
        }

        if (validateTokenResponse != null && validateTokenResponse.isValid()) {
            UserPrincipal userPrincipal = new UserPrincipal(
                    validateTokenResponse.getUserId(),
                    validateTokenResponse.getEmail(),
                    validateTokenResponse.getRole()
            );

            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                            userPrincipal   ,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + validateTokenResponse.getRole()))
                    );
            SecurityContextHolder.getContext().setAuthentication(auth);
        } else {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
