package com.realty_app.chat_service.service;

import com.realty_app.chat_service.dto.ChatMessage;
import com.realty_app.chat_service.model.Conversation;
import com.realty_app.chat_service.model.Message;
import com.realty_app.chat_service.model.MessageStatus;
import com.realty_app.chat_service.model.MessageType;
import com.realty_app.chat_service.repository.ConversationRepository;
import com.realty_app.chat_service.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;

    @Value("${support.user-id}")
    private Long supportUserId;

    public Message save(Long conversationId, Long senderId, String role, String text) {
        if (text == null || text.isBlank()) {
            throw new RuntimeException("Сообщение не может быть пустым");
        }

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Диалог не найден."));

        boolean supportConversation = isSupportConversation(conversation);
        boolean staff = isModeratorOrAdmin(role);

        if (!isParticipant(conversation, senderId) && !(supportConversation && staff)) {
            throw new RuntimeException("Данный пользователь не является участником этого диалога");
        }

        Long actualSenderId = supportConversation && staff
                ? supportUserId
                : senderId;

        Message message = Message.builder()
                .conversationId(conversationId)
                .senderId(actualSenderId)
                .text(text.trim())
                .type(MessageType.USER)
                .build();

        return messageRepository.save(message);
    }

    public Message saveSystemMessage(Long conversationId, Long senderId, String text) {
        if (text == null || text.isBlank()) {
            throw new RuntimeException("Системное сообщение не может быть пустым");
        }

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Диалог не найден."));

        if (!senderId.equals(conversation.getParticipant1Id())
                && !senderId.equals(conversation.getParticipant2Id())) {
            throw new RuntimeException("Данный пользователь не является участником этого диалога");
        }

        Message message = Message.builder()
                .conversationId(conversationId)
                .senderId(senderId)
                .text(text.trim())
                .type(MessageType.SYSTEM)
                .build();

        return messageRepository.save(message);
    }

    public List<Message> getByConversation(Long conversationId, Long userId, String role) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Диалог не найден."));

        boolean supportConversation = isSupportConversation(conversation);
        boolean staff = isModeratorOrAdmin(role);

        if (!isParticipant(conversation, userId) && !(supportConversation && staff)) {
            throw new RuntimeException("Пользователь не является участником этого диалога");
        }
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    public List<Message> markAsRead(Long conversationId, Long userId, String role) {

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Диалог не найден."));

        boolean supportConversation = isSupportConversation(conversation);
        boolean staff = isModeratorOrAdmin(role);

        if (!isParticipant(conversation, userId) && !(supportConversation && staff)) {
            throw new RuntimeException("Пользователь не является участником этого диалога");
        }

        Long readerIdentity = supportConversation && staff
                ? supportUserId
                : userId;

        List<Message> unread = messageRepository
                .findByConversationIdAndSenderIdNotAndStatus(
                        conversationId,
                        readerIdentity,
                        MessageStatus.SENT
                );
        unread.forEach(m -> m.setStatus(MessageStatus.READ));

        return messageRepository.saveAll(unread);
    }

    private boolean isModeratorOrAdmin(String role) {
        return "ADMIN".equals(role) || "MODERATOR".equals(role);
    }

    private boolean isSupportConversation(Conversation conversation) {
        return supportUserId.equals(conversation.getParticipant1Id())
                || supportUserId.equals(conversation.getParticipant2Id());
    }

    private boolean isParticipant(Conversation conversation, Long userId) {
        return userId.equals(conversation.getParticipant1Id())
                || userId.equals(conversation.getParticipant2Id());
    }

}
