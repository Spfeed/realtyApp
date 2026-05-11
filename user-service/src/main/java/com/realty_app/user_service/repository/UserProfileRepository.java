package com.realty_app.user_service.repository;

import com.realty_app.user_service.model.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByAuthUserId(Long authUserId);
    boolean existsByAuthUserId(Long authUserId);
}
