package com.realty_app.listing_service.dto.geo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NearbyPlacesResponse {
    private List<NearbyPlaceResponse> schools;
    private List<NearbyPlaceResponse> kindergartens;
    private List<NearbyPlaceResponse> universities;
    private List<NearbyPlaceResponse> hospitals;
    private List<NearbyPlaceResponse> pharmacies;
    private List<NearbyPlaceResponse> shops;
    private List<NearbyPlaceResponse> transport;
    private List<NearbyPlaceResponse> parks;
    private List<NearbyPlaceResponse> food;
}
