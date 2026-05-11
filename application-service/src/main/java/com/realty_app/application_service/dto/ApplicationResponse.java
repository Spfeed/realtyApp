package com.realty_app.application_service.dto;

import com.realty_app.application_service.model.ApplicationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ApplicationResponse {
    private Long id;
    private Long userId;
    private Long listingId;
    private ApplicationStatus status;
    private Long conversationId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
