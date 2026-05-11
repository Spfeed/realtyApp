package com.realty_app.application_service.controller;

import com.realty_app.application_service.dto.ApplicationResponse;
import com.realty_app.application_service.dto.CreateApplicationRequest;
import com.realty_app.application_service.security.UserPrincipal;
import com.realty_app.application_service.service.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/applications")
@RequiredArgsConstructor
public class ApplicationController {
    private final ApplicationService applicationService;

    @PostMapping
    public ApplicationResponse create (
            @Valid @RequestBody CreateApplicationRequest request,
            Authentication authentication
    ) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        return applicationService.create(request, userPrincipal.getUserId());
    }

    @GetMapping("/my")
    public List<ApplicationResponse> getMy(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        return applicationService.getMyApplications(userPrincipal.getUserId());
    }

    @GetMapping("/listing/{listingId}")
    public List<ApplicationResponse> getByListingId(
            @PathVariable Long listingId,
            Authentication auth
    ) {
        UserPrincipal userPrincipal = (UserPrincipal) auth.getPrincipal();

        return applicationService.getByListingId(
                listingId,
                userPrincipal.getUserId()
        );
    }

    @PatchMapping("{id}/approve")
    public ApplicationResponse approve(
            @PathVariable Long id,
            Authentication authentication
    ) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        return applicationService.approve(id, userPrincipal.getUserId());
    }

    @PatchMapping("/{id}/reject")
    public ApplicationResponse reject(
            @PathVariable Long id,
            Authentication authentication
    ) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        return applicationService.reject(id, userPrincipal.getUserId());
    }

    @GetMapping("/my/listings/{listingId}")
    public ApplicationResponse getMyByListingId(
            @PathVariable Long listingId,
            Authentication authentication
    ) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        return applicationService.getMyByListing(listingId, userPrincipal.getUserId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(
            @PathVariable Long id,
            Authentication authentication
    ) {
        UserPrincipal userPrincipal =
                (UserPrincipal) authentication.getPrincipal();

        applicationService.cancel(id, userPrincipal.getUserId());
    }
}
