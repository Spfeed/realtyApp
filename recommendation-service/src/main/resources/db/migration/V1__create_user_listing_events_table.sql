CREATE TABLE user_listing_events (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,
    listing_id BIGINT NOT NULL,

    event_type VARCHAR(32) NOT NULL,

    event_weight DOUBLE PRECISION NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);