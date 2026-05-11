package com.realty_app.chat_service.controller;

import com.realty_app.chat_service.dto.ConversationPreviewResponse;
import com.realty_app.chat_service.model.Conversation;
import com.realty_app.chat_service.model.Message;
import com.realty_app.chat_service.security.UserPrincipal;
import com.realty_app.chat_service.service.ConversationService;
import com.realty_app.chat_service.service.MessageService;
import com.realty_app.chat_service.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/conversations")
public class ConversationController {

    private final ConversationService conversationService;
    private final MessageService messageService;
    private final PresenceService presenceService;

    @PostMapping
    public Conversation create(
            @RequestParam Long listingId,
            @RequestParam Long otherUserId,
            Authentication auth
    ) {
        UserPrincipal userPrincipal = (UserPrincipal) auth.getPrincipal();

        return conversationService.getOrCreate(
                listingId,
                userPrincipal.getUserId(),
                otherUserId
        );
    }

    @GetMapping("/{conversationId}/messages")
    public List<Message> getMessages(
            @PathVariable Long conversationId,
            Authentication auth
    ) {
        UserPrincipal userPrincipal = (UserPrincipal) auth.getPrincipal();

        return messageService.getByConversation(
                conversationId,
                userPrincipal.getUserId(),
                userPrincipal.getRole()
        );
    }

    @GetMapping("/my")
    public List<ConversationPreviewResponse> getMyConversations(Authentication auth) {
        UserPrincipal userPrincipal = (UserPrincipal) auth.getPrincipal();

        return conversationService.getMyConversationPreviews(userPrincipal.getUserId());
    }

    @PatchMapping("/{conversationId}/read")
    public void markAsRead(
            @PathVariable Long conversationId,
            Authentication auth
    ) {
        UserPrincipal userPrincipal = (UserPrincipal) auth.getPrincipal();

        messageService.markAsRead(conversationId, userPrincipal.getUserId(), userPrincipal.getRole());
    }

    @GetMapping("/presence/{userId}")
    public boolean isOnline(@PathVariable Long userId) {
        return presenceService.isOnline(userId);
    }

    @PostMapping("/support")
    public ConversationPreviewResponse getOrCreateSupport(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        Conversation conversation = conversationService.getOrCreateSupportConversation(
                principal.getUserId()
        );

        return conversationService.getPreviewForUser(conversation, principal.getUserId());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    @GetMapping("/support")
    public List<ConversationPreviewResponse> getSupportConversations() {
        return conversationService.getSupportConversationPreviews();
    }
}
