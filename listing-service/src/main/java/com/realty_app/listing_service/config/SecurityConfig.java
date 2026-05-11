package com.realty_app.listing_service.config;

import com.realty_app.listing_service.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
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
                        .requestMatchers("/references/admin/**").hasAnyRole("ADMIN", "MODERATOR")
                        .requestMatchers("/references/**").permitAll()
                        .requestMatchers("/debug/**").permitAll()

                        .requestMatchers(HttpMethod.GET, "/listings").permitAll()
                        .requestMatchers(HttpMethod.GET, "/listings/filter").permitAll()
                        .requestMatchers(HttpMethod.GET, "/listings/my").authenticated()
                        .requestMatchers(HttpMethod.GET, "/listings/*/photos").permitAll()
                        .requestMatchers(HttpMethod.GET, "/listings/media/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/listings/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/listings/{id}/nearby").permitAll()

                        .requestMatchers("/listings/internal/**").hasRole("SERVICE")
                        .requestMatchers("/listings/admin/**").hasAnyRole("ADMIN", "MODERATOR")

                        .requestMatchers(HttpMethod.POST, "/listings").authenticated()
                        .requestMatchers(HttpMethod.POST, "/listings/{listingId}/photos").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/listings/{id}").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/listings/{id}").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/listings/photos/{photoId}").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/listings/photos/{photoId}/main").authenticated()

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
