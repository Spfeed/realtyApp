package com.realty_app.listing_service.repository;

import com.realty_app.listing_service.model.Listing;
import com.realty_app.listing_service.model.ListingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface ListingRepository extends JpaRepository<Listing,Long>, JpaSpecificationExecutor<Listing> {
    List<Listing> findByOwnerId (Long ownerId);
    List<Listing> findByStatus(ListingStatus status);
    List<Listing> findByStatusIn(List<ListingStatus> statuses);
    List<Listing> findByOwnerIdAndStatusNot(Long ownerId, ListingStatus status);
}
