package com.realty_app.review_service.client;

import com.realty_app.review_service.dto.ListingOwnerResponse;
import com.realty_app.review_service.dto.ListingResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
public class ListingClient {
    private final RestTemplate restTemplate;

    @Value("${internal.service-token}")
    private String serviceToken;

    public ListingOwnerResponse getListingOwner(Long listingId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(serviceToken);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<ListingOwnerResponse> response = restTemplate.exchange(
                "http://listing-service/listings/internal/" + listingId + "/owner",
                HttpMethod.GET,
                entity,
                ListingOwnerResponse.class
        );

        return response.getBody();
    }
}
