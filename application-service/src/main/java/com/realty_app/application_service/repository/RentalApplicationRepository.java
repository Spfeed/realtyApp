package com.realty_app.application_service.repository;

import com.realty_app.application_service.model.ApplicationStatus;
import com.realty_app.application_service.model.RentalApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RentalApplicationRepository extends JpaRepository<RentalApplication,Long> {

    List<RentalApplication> findByUserId(Long userId);

    List<RentalApplication> findByListingId(Long listingId);

    Optional<RentalApplication> findByUserIdAndListingId(Long userId, Long listingId);

    boolean existsByUserIdAndListingId(Long userId, Long listingId);

    Optional<RentalApplication> findByIdAndUserIdAndListingId(Long id, Long userId, Long listingId);

    List<RentalApplication> findByListingIdAndIdNotAndStatus(
            Long listingId,
            Long id,
            ApplicationStatus status
    );
}
