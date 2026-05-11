package com.realty_app.listing_service.repository;

import com.realty_app.listing_service.model.District;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DistrictRepository extends JpaRepository<District, Long> {
    Optional<District> findByIdAndCityId(Long id, Long cityId);
    List<District> findByCityId(Long cityId);
}
