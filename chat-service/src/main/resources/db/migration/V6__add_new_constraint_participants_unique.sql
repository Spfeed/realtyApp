ALTER TABLE conversations
ADD CONSTRAINT uk_conversation_participants
UNIQUE (participant_1_id, participant_2_id);