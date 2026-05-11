package com.realty_app.listing_service.controller;

import com.realty_app.listing_service.dto.geo.GeoCoordinates;
import com.realty_app.listing_service.service.geo.YandexGeocodingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/debug/geo")
@RequiredArgsConstructor
public class GeoDebugController {
    private final YandexGeocodingService yandexGeocodingService;

    @GetMapping
    public GeoCoordinates geocode(@RequestParam String address) {
        return yandexGeocodingService.geocode(address)
                .orElseThrow(() -> new RuntimeException("Координаты не найдены."));
    }
}
