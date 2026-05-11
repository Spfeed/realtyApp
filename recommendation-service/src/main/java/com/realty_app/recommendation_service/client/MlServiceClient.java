package com.realty_app.recommendation_service.client;

import com.realty_app.recommendation_service.dto.MlRecommendationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Component
@RequiredArgsConstructor
public class MlServiceClient {
    private final RestTemplate restTemplate;

    @Value("${ml-service.url}")
    private String mlServiceUrl;

    public List<MlRecommendationResponse> getHybridRecommendations(
            Long userId,
            int limit
    ) {
        return restTemplate.exchange(
                mlServiceUrl + "/recommendations/hybrid/" + userId + "?limit=" + limit,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<MlRecommendationResponse>>() {}
        ).getBody();
    }
}
