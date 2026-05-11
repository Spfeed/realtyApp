package com.realty_app.chat_service.config;

import com.realty_app.chat_service.security.UserPrincipal;
import com.realty_app.chat_service.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@RequiredArgsConstructor
public class WebSocketPresenceEventListener {

    private final PresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleConnected(SessionConnectedEvent event) {
        Authentication auth = (Authentication) event.getUser();

        if (auth == null)  return;

        UserPrincipal user = (UserPrincipal) auth.getPrincipal();

        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();

        if (sessionId == null) return;

        boolean shouldNotify = presenceService.online(user.getUserId(),  sessionId);

        if (shouldNotify) {
            messagingTemplate.convertAndSend(
                    "/topic/presence/" + user.getUserId(),
                    true
            );
        }
    }

    @EventListener
    public void handleDisconnected(SessionDisconnectEvent event) {
        Authentication auth = (Authentication) event.getUser();

        if (auth == null)  return;

        UserPrincipal user = (UserPrincipal) auth.getPrincipal();

        String sessionId = event.getSessionId();

        boolean shouldNotify = presenceService.offline(user.getUserId(), sessionId);

        if (shouldNotify) {
            messagingTemplate.convertAndSend(
                    "/topic/presence/" + user.getUserId(),
                    false
            );
        }
    }
}
