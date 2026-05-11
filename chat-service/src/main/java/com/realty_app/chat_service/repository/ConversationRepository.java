package com.realty_app.chat_service.repository;

import com.realty_app.chat_service.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByParticipant1IdOrParticipant2Id(Long p1, Long p2);

    Optional<Conversation> findByListingIdAndParticipant1IdAndParticipant2Id(
            Long listingId,
            Long participant1Id,
            Long participant2Id
    );

    Optional<Conversation> findByParticipant1IdAndParticipant2Id(
            Long participant1Id,
            Long participant2Id
    );

    List<Conversation> findByListingIdIsNullAndParticipant2Id(Long participant2Id);
}
