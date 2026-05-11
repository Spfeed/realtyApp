ALTER TABLE listings
ADD COLUMN floor INTEGER,
ADD COLUMN has_elevator BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE listings
ADD CONSTRAINT chk_listing_floor_positive
CHECK (floor IS NULL OR floor >= 1);