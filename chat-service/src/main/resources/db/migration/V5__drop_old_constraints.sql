ALTER TABLE conversations
DROP CONSTRAINT uk_conversation_listing_participants;

ALTER TABLE conversations
ALTER COLUMN listing_id DROP NOT NULL;