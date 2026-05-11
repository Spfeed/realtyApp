package com.realty_app.recommendation_service.controller;

import com.realty_app.recommendation_service.dto.CreateUserListingEventRequest;
import com.realty_app.recommendation_service.dto.MlRecommendationResponse;
import com.realty_app.recommendation_service.dto.MlUserListingEventResponse;
import com.realty_app.recommendation_service.model.UserListingEvent;
import com.realty_app.recommendation_service.security.UserPrincipal;
import com.realty_app.recommendation_service.service.RecommendationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/recommendations")
@RequiredArgsConstructor
public class RecommendationController {
    private final RecommendationService recommendationService;

    @PostMapping("/events")
    public UserListingEvent createEvent(
            @Valid @RequestBody CreateUserListingEventRequest request,
            Authentication authentication
    ) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        return recommendationService.saveEvent(
                userPrincipal.getUserId(),
                request.getListingId(),
                request.getEventType()
        );
    }

    @PreAuthorize("hasRole('SERVICE')")
    @GetMapping("/internal/ml/events")
    public List<MlUserListingEventResponse> getAllEventsForMl() {
        return recommendationService.getAllEventsForMl();
    }

    @PreAuthorize("hasRole('SERVICE')")
    @GetMapping("/internal/ml/users/{userId}/events")
    public List<MlUserListingEventResponse> getUserEventsForMl(
            @PathVariable Long userId
    ) {
        return recommendationService.getUserEventsForMl(userId);
    }

    @GetMapping("/me")
    public List<MlRecommendationResponse> getMyRecommendations(
            Authentication authentication,
            @RequestParam(defaultValue = "3") int limit
    ) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        return recommendationService.getMyRecommendations(
                userPrincipal.getUserId(),
                limit
        );
    }
}
