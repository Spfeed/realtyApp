package com.realty_app.review_service.controller;

import com.realty_app.review_service.dto.CreateReviewRequest;
import com.realty_app.review_service.dto.ReviewResponse;
import com.realty_app.review_service.dto.UpdateReviewRequest;
import com.realty_app.review_service.model.ReviewTargetType;
import com.realty_app.review_service.security.UserPrincipal;
import com.realty_app.review_service.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviewService;

    @PostMapping
    public ReviewResponse create(
            @Valid @RequestBody CreateReviewRequest request,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        return reviewService.create(request, principal.getUserId());
    }

    @GetMapping("/my")
    public List<ReviewResponse> myReviews(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return reviewService.getMyReviews(principal.getUserId());
    }

    @GetMapping
    public List<ReviewResponse> getByTarget(
            @RequestParam ReviewTargetType targetType,
            @RequestParam Long targetId
    ) {
        return reviewService.getByTarget(targetType, targetId);
    }

    @PutMapping("/{reviewId}")
    public ReviewResponse update(
            @PathVariable Long reviewId,
            @Valid @RequestBody UpdateReviewRequest request,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return reviewService.update(reviewId, request, principal.getUserId());
    }

    @DeleteMapping("/{reviewId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long reviewId,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        reviewService.delete(reviewId, principal.getUserId());
    }
}
