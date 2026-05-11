package com.realty_app.listing_service.repository;

import com.realty_app.listing_service.model.ListingPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ListingPhotoRepository extends JpaRepository<ListingPhoto, Long> {
    List<ListingPhoto> findByListingIdOrderBySortOrderAscIdAsc(Long listingId);

    int countByListingId(Long listingId);

    boolean existsByListingIdAndIsMainTrue(Long listingId);

    List<ListingPhoto> findByListingId(Long listingId);
}
