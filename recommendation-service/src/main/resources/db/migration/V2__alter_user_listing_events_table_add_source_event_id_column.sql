ALTER TABLE user_listing_events
ADD COLUMN source_event_id BIGINT;

CREATE INDEX idx_user_listing_events_source
ON user_listing_events(event_type, source_event_id);