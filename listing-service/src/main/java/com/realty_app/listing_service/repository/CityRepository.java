package com.realty_app.listing_service.repository;

import com.realty_app.listing_service.model.City;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CityRepository extends JpaRepository<City,Long> {
}
