CREATE TABLE user_profiles (
    id BIGSERIAL PRIMARY KEY,
    auth_user_id BIGINT NOT NULL,
    surname VARCHAR(255),
    name VARCHAR(255),
    patronymic VARCHAR(255),
    phone VARCHAR(50)
);