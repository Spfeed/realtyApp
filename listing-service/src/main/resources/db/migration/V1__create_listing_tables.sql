CREATE TABLE cities (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE districts (
    id BIGSERIAL PRIMARY KEY,
    city_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,

    CONSTRAINT fk_district_city
        FOREIGN KEY (city_id)
        REFERENCES cities(id)
        ON DELETE CASCADE,

    CONSTRAINT uk_district_city_name
        UNIQUE (city_id, name)
);

CREATE TABLE living_rules (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE listings (
    id BIGSERIAL PRIMARY KEY,

    title VARCHAR(255) NOT NULL,
    description TEXT,

    area NUMERIC(8,2) NOT NULL,
    price NUMERIC(10,2) NOT NULL,

    utilities_included BOOLEAN NOT NULL DEFAULT FALSE,

    deposit_amount NUMERIC(10,2) NOT NULL DEFAULT 0,

    owner_id BIGINT NOT NULL,

    city_id BIGINT NOT NULL,
    district_id BIGINT,

    street VARCHAR(255) NOT NULL,
    house_number VARCHAR(50) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,

    CONSTRAINT fk_listing_city
        FOREIGN KEY (city_id)
        REFERENCES cities(id),

    CONSTRAINT fk_listing_district
        FOREIGN KEY (district_id)
        REFERENCES districts(id),

    CONSTRAINT chk_listing_area_positive
        CHECK (area > 0),

    CONSTRAINT chk_listing_price_positive
        CHECK (price > 0),

    CONSTRAINT chk_listing_deposit_non_negative
        CHECK (deposit_amount >= 0)
);

CREATE TABLE listing_living_rules (
    listing_id BIGINT NOT NULL,
    living_rule_id BIGINT NOT NULL,

    PRIMARY KEY (listing_id, living_rule_id),

    CONSTRAINT fk_listing_living_rules_listing
        FOREIGN KEY (listing_id)
        REFERENCES listings(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_listing_living_rules_rule
        FOREIGN KEY (living_rule_id)
        REFERENCES living_rules(id)
        ON DELETE CASCADE
);