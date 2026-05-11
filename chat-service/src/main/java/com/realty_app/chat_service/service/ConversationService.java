package com.realty_app.chat_service.service;

import com.realty_app.chat_service.dto.ConversationPreviewResponse;
import com.realty_app.chat_service.model.Conversation;
import com.realty_app.chat_service.model.Message;
import com.realty_app.chat_service.model.MessageStatus;
import com.realty_app.chat_service.repository.ConversationRepository;
import com.realty_app.chat_service.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ConversationService {
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

    @Value("${support.user-id}")
    private Long supportUserId;

    public Conversation getOrCreate(Long listingId, Long user1Id, Long user2Id) {

        Long p1 = Math.min(user1Id, user2Id);
        Long p2 = Math.max(user1Id, user2Id);

        return conversationRepository
                .findByParticipant1IdAndParticipant2Id(p1, p2)
                .orElseGet(() -> {
                    return conversationRepository.save(
                            Conversation.builder()
                                    .participant1Id(p1)
                                    .participant2Id(p2)
                                    .listingId(listingId)
                                    .build()
                    );
                });
    }

    public List<Conversation> getMyConversations(Long userId) {
        return conversationRepository.findByParticipant1IdOrParticipant2Id(userId, userId);
    }

    public List<ConversationPreviewResponse> getMyConversationPreviews(Long userId) {
        return conversationRepository.findByParticipant1IdOrParticipant2Id(userId, userId)
                .stream()
                .map(conversation -> toPreview(conversation, userId))
                .sorted((a, b) -> {
                    LocalDateTime aTime = a.getLastMessageCreatedAt() != null
                            ? a.getLastMessageCreatedAt()
                            : a.getCreatedAt();

                    LocalDateTime bTime = b.getLastMessageCreatedAt() != null
                            ? b.getLastMessageCreatedAt()
                            : b.getCreatedAt();

                    return bTime.compareTo(aTime);
                })
                .toList();
    }

    public ConversationPreviewResponse getPreviewForUser(Conversation conversation, Long userId) {
        Message lastMessage = messageRepository
                .findTopByConversationIdOrderByCreatedAtDesc(conversation.getId())
                .orElse(null);

        long unreadCount = messageRepository.countByConversationIdAndSenderIdNotAndStatus(
                conversation.getId(),
                userId,
                MessageStatus.SENT
        );

        return ConversationPreviewResponse.builder()
                .id(conversation.getId())
                .listingId(conversation.getListingId())
                .participant1Id(conversation.getParticipant1Id())
                .participant2Id(conversation.getParticipant2Id())
                .createdAt(conversation.getCreatedAt())
                .lastMessageText(lastMessage != null ? lastMessage.getText() : null)
                .lastMessageSenderId(lastMessage != null ? lastMessage.getSenderId() : null)
                .lastMessageCreatedAt(lastMessage != null ? lastMessage.getCreatedAt() : null)
                .unreadCount(unreadCount)
                .lastMessageType(lastMessage != null ? lastMessage.getType() : null)
                .build();
    }

    public Conversation getOrCreateSupportConversation(Long userId) {
        if (userId.equals(supportUserId)) {
            throw new RuntimeException("Пользователь не может быть службой поддержки");
        }

        Long p1 = Math.min(userId, supportUserId);
        Long p2 = Math.max(userId, supportUserId);

        return conversationRepository
                .findByParticipant1IdAndParticipant2Id(p1, p2)
                .orElseGet(() -> conversationRepository.save(
                        Conversation.builder()
                                .listingId(null)
                                .participant1Id(p1)
                                .participant2Id(p2)
                                .build()
                ));
    }

    public List<ConversationPreviewResponse> getSupportConversationPreviews() {
        return conversationRepository
                .findByParticipant1IdOrParticipant2Id(supportUserId, supportUserId)
                .stream()
                .map(conversation -> getPreviewForUser(conversation, supportUserId))
                .sorted((a, b) -> {
                    LocalDateTime aTime = a.getLastMessageCreatedAt() != null
                            ? a.getLastMessageCreatedAt()
                            : a.getCreatedAt();

                    LocalDateTime bTime = b.getLastMessageCreatedAt() != null
                            ? b.getLastMessageCreatedAt()
                            : b.getCreatedAt();

                    return bTime.compareTo(aTime);
                })
                .toList();
    }

    public boolean isSupportConversation(Conversation conversation) {
        return supportUserId.equals(conversation.getParticipant1Id())
                || supportUserId.equals(conversation.getParticipant2Id());
    }

    public ConversationPreviewResponse getSupportPreview(Conversation conversation) {
        return getPreviewForUser(conversation, supportUserId);
    }

    private ConversationPreviewResponse toPreview(Conversation conversation, Long userId) {
        Message lastMessage = messageRepository
                .findTopByConversationIdOrderByCreatedAtDesc(conversation.getId())
                .orElse(null);

        long unreadCount = messageRepository.countByConversationIdAndSenderIdNotAndStatus(
                conversation.getId(),
                userId,
                MessageStatus.SENT
        );

        return ConversationPreviewResponse.builder()
                .id(conversation.getId())
                .listingId(conversation.getListingId())
                .participant1Id(conversation.getParticipant1Id())
                .participant2Id(conversation.getParticipant2Id())
                .createdAt(conversation.getCreatedAt())
                .lastMessageText(lastMessage != null ? lastMessage.getText() : null)
                .lastMessageSenderId(lastMessage != null ? lastMessage.getSenderId() : null)
                .lastMessageCreatedAt(lastMessage != null ? lastMessage.getCreatedAt() : null)
                .unreadCount(unreadCount)
                .lastMessageType(lastMessage != null ? lastMessage.getType() : null)
                .build();
    }
}
