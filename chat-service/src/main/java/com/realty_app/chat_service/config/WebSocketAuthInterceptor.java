package com.realty_app.chat_service.config;

import com.realty_app.chat_service.dto.ValidateTokenResponse;
import com.realty_app.chat_service.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {
    private final RestTemplate restTemplate;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                StompHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {

            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new RuntimeException("Токен авторизации не найден");
            }

            String token = authHeader.substring(7);

            ValidateTokenResponse response = restTemplate.postForObject(
                    "http://auth-service/auth/validate",
                    Map.of("token", token),
                    ValidateTokenResponse.class
            );

            if (response == null || !response.isValid()) {
                throw new RuntimeException("Неверный токен");
            }

            UserPrincipal user = new UserPrincipal(
                    response.getUserId(),
                    response.getEmail(),
                    response.getRole()
            );

            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                            user,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + response.getRole()))
                    );
            accessor.setUser(auth);
        }
        return message;
    }
}
