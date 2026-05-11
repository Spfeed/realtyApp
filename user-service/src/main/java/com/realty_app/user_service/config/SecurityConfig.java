package com.realty_app.user_service.config;

import com.realty_app.user_service.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth ->auth
                        .requestMatchers("/public/**").permitAll()

                        .requestMatchers(HttpMethod.GET, "/users/profile/{authUserId}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/users/media/**").permitAll()

                        .requestMatchers(HttpMethod.POST, "/users/profile").authenticated()
                        .requestMatchers(HttpMethod.GET, "/users/profile/me").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/users/profile/me").authenticated()
                        .requestMatchers(HttpMethod.POST, "/users/profile/avatar").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/users/profile/avatar").authenticated()

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
