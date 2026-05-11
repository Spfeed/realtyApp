package com.realty_app.review_service.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReviewEvent {
    private Long reviewId;
    private Long authorId;
    private Long listingId;
    private Integer rating;
}
