package com.realty_app.recommendation_service.dto;

import lombok.Data;

@Data
public class ReviewEvent {
    private Long reviewId;
    private Long authorId;
    private Long listingId;
    private Integer rating;
}
