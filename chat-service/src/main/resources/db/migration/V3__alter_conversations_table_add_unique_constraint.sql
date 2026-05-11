ALTER TABLE conversations
ADD CONSTRAINT uk_conversation_listing_participants
UNIQUE (listing_id, participant_1_id, participant_2_id);