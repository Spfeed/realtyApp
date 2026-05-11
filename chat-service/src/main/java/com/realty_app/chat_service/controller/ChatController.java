package com.realty_app.chat_service.controller;

import com.realty_app.chat_service.dto.*;
import com.realty_app.chat_service.model.Conversation;
import com.realty_app.chat_service.model.Message;
import com.realty_app.chat_service.repository.ConversationRepository;
import com.realty_app.chat_service.security.UserPrincipal;
import com.realty_app.chat_service.service.ConversationService;
import com.realty_app.chat_service.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.List;

@Controller
@RequiredArgsConstructor
public class ChatController {
    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;
    private final ConversationService conversationService;
    private final ConversationRepository conversationRepository;

    @MessageMapping("/chat.send")
    public void send(SendMessageRequest request, Principal principal) {

        UserPrincipal user = (UserPrincipal) ((Authentication) principal).getPrincipal();

        Message saved = messageService.save(
                request.getConversationId(),
                user.getUserId(),
                user.getRole(),
                request.getText()
        );

        ChatMessageResponse response = ChatMessageResponse.builder()
                .id(saved.getId())
                .conversationId(saved.getConversationId())
                .senderId(saved.getSenderId())
                .text(saved.getText())
                .createdAt(saved.getCreatedAt())
                .status(saved.getStatus())
                .type(saved.getType())
                .build();

        messagingTemplate.convertAndSend(
                "/topic/chat/" + saved.getConversationId(),
                response
        );

        Conversation conversation = conversationRepository.findById(saved.getConversationId())
                .orElseThrow();

        Long p1 = conversation.getParticipant1Id();
        Long p2 = conversation.getParticipant2Id();

        ConversationPreviewResponse preview1 =
                conversationService.getPreviewForUser(conversation, p1);

        ConversationPreviewResponse preview2 =
                conversationService.getPreviewForUser(conversation, p2);

        messagingTemplate.convertAndSend("/topic/chat-updates/" + p1, preview1);
        messagingTemplate.convertAndSend("/topic/chat-updates/" + p2, preview2);

        if (conversationService.isSupportConversation(conversation)) {
            messagingTemplate.convertAndSend(
                    "/topic/support-updates",
                    conversationService.getSupportPreview(conversation)
            );
        }
    }

    @MessageMapping("/chat.read")
    public void read(ReadMessagesRequest request, Principal principal) {
        UserPrincipal user = (UserPrincipal) ((Authentication) principal).getPrincipal();

        List<Message> updatedMessages = messageService.markAsRead(
                request.getConversationId(),
                user.getUserId(),
                user.getRole()
        );

        if (updatedMessages.isEmpty()) {
            return;
        }

        ReadReceiptResponse response = ReadReceiptResponse.builder()
                .conversationId(request.getConversationId())
                .readerId(user.getUserId())
                .messageIds(
                        updatedMessages.stream()
                                .map(Message::getId)
                                .toList()
                )
                .build();

        messagingTemplate.convertAndSend(
                "/topic/chat/" + request.getConversationId() + "/read",
                response
        );
    }

    @MessageMapping("/chat.typing")
    public void typing(TypingRequest request, Principal principal) {
        UserPrincipal user = (UserPrincipal) ((Authentication) principal).getPrincipal();

        TypingResponse response = TypingResponse.builder()
                .conversationId(request.getConversationId())
                .userId(user.getUserId())
                .typing(request.isTyping())
                .build();

        messagingTemplate.convertAndSend(
                "/topic/chat/" + request.getConversationId() + "/typing",
                response
        );
    }
}
