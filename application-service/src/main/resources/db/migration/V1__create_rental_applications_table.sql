CREATE TABLE rental_applications (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,
    listing_id BIGINT NOT NULL,

    status VARCHAR(50) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,

    CONSTRAINT uk_user_listing_application
        UNIQUE (user_id, listing_id)
);