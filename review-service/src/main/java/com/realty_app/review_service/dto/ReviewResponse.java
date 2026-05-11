package com.realty_app.review_service.dto;

import com.realty_app.review_service.model.ReviewTargetType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReviewResponse {
    private Long id;
    private Long authorId;
    private ReviewTargetType targetType;
    private Long targetId;
    private Integer rating;
    private String text;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
