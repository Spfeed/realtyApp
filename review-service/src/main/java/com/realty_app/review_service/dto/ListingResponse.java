package com.realty_app.review_service.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ListingResponse {
    private Long id;
    private Long ownerId;
}
