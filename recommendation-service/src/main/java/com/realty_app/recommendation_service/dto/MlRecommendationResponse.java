package com.realty_app.recommendation_service.dto;

import lombok.Data;

@Data
public class MlRecommendationResponse {
    private Long listingId;
    private Double score;
}
