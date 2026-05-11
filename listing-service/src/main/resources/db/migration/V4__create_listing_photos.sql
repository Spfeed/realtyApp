CREATE TABLE listing_photos (
    id BIGSERIAL PRIMARY KEY,

    listing_id BIGINT NOT NULL,
    url VARCHAR(500) NOT NULL,

    sort_order INT NOT NULL DEFAULT 0,
    is_main BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_listing_photos_listing
        FOREIGN KEY (listing_id)
        REFERENCES listings(id)
        ON DELETE CASCADE
);