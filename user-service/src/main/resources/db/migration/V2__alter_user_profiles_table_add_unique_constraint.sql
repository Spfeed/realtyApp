ALTER TABLE user_profiles
ADD CONSTRAINT uk_user_profiles_auth_user_id UNIQUE (auth_user_id);