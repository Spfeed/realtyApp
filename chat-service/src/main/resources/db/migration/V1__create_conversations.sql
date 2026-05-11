CREATE TABLE conversations (
    id BIGSERIAL PRIMARY KEY,

    listing_id BIGINT NOT NULL,

    participant_1_id BIGINT NOT NULL,
    participant_2_id BIGINT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_participants_not_equal
        CHECK (participant_1_id <> participant_2_id)
);