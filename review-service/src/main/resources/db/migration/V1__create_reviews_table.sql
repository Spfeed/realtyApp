CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,

    author_id BIGINT NOT NULL,

    target_type VARCHAR(50) NOT NULL,
    target_id BIGINT NOT NULL,

    rating INT NOT NULL,
    text TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,

    CONSTRAINT chk_review_rating
        CHECK (rating >= 1 AND rating <= 5),

    CONSTRAINT uk_review_author_target
        UNIQUE (author_id, target_type, target_id)
);