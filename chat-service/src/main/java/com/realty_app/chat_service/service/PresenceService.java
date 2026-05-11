package com.realty_app.chat_service.service;

import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceService {
    private final ConcurrentHashMap<Long, Set<String>> userSessions = new ConcurrentHashMap<>();

    public boolean online(Long userId, String sessionId) {
        Set<String> sessions = userSessions.computeIfAbsent(
                userId,
                id -> ConcurrentHashMap.newKeySet()
        );

        boolean wasOffline = sessions.isEmpty();
        sessions.add(sessionId);

        return wasOffline;
    }

    public boolean offline(Long userId, String sessionId) {
        Set<String> sessions = userSessions.get(userId);

        if (sessions == null) {
            return false;
        }

        sessions.remove(sessionId);

        if (sessions.isEmpty()) {
            userSessions.remove(userId);
            return true;
        }

        return false;
    }

    public boolean isOnline(Long userId) {
        Set<String> sessions = userSessions.get(userId);
        return sessions != null && !sessions.isEmpty();
    }
}
