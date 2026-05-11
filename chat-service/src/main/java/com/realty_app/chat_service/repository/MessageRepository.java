package com.realty_app.chat_service.repository;

import com.realty_app.chat_service.model.Message;
import com.realty_app.chat_service.model.MessageStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    Optional<Message> findTopByConversationIdOrderByCreatedAtDesc(Long conversationId);

    List<Message> findByConversationIdAndSenderIdNotAndStatus(
            Long conversationId,
            Long senderId,
            MessageStatus status
    );

    long countByConversationIdAndSenderIdNotAndStatus(
            Long conversationId,
            Long senderId,
            MessageStatus status
    );
}
