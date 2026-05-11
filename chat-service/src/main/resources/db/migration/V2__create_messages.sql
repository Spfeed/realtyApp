CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,

    conversation_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,

    text TEXT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_conversation
        FOREIGN KEY (conversation_id)
        REFERENCES conversations(id)
        ON DELETE CASCADE
);