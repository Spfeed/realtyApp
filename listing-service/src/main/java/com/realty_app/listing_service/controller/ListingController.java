package com.realty_app.listing_service.controller;

import com.realty_app.listing_service.dto.*;
import com.realty_app.listing_service.dto.geo.NearbyPlacesResponse;
import com.realty_app.listing_service.model.Listing;
import com.realty_app.listing_service.security.UserPrincipal;
import com.realty_app.listing_service.service.ListingService;
import com.realty_app.listing_service.service.geo.OverpassNearbyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;


@RestController
@RequestMapping("/listings")
@RequiredArgsConstructor
public class ListingController {
    private final ListingService listingService;
    private final OverpassNearbyService overpassNearbyService;

    @PostMapping
    public ListingResponse create(
            @Valid @RequestBody CreateListingRequest request,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        return listingService.create(request, principal.getUserId());
    }

    @GetMapping("/{id}")
    public ListingResponse getById(@PathVariable Long id, Authentication authentication) {
        Long currentUserId = null;
        String role = null;
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
            currentUserId = principal.getUserId();
            role = principal.getRole();
        }
        return listingService.getById(id, currentUserId, role);
    }

    @GetMapping
    public List<ListingResponse> getAll() {
        return listingService.getAll();
    }

    @GetMapping("/my")
    public List<ListingResponse> getMy(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return listingService.getByOwnerId(principal.getUserId());
    }

    @GetMapping("/filter")
    public List<ListingResponse> filter(ListingFilterRequest filter) {
        return listingService.filter(filter);
    }

    @PutMapping("/{id}")
    public ListingResponse update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateListingRequest request,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        return listingService.update(
                id,
                request,
                principal.getUserId(),
                principal.getRole()
        );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long id,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        listingService.delete(
                id,
                principal.getUserId(),
                principal.getRole()
        );
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    @GetMapping("/admin/moderation")
    public List<ListingResponse> getForModeration() {
        return listingService.getListingsForModeration();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    @PatchMapping("/admin/moderation/{id}/approve")
    public ListingResponse approve(@PathVariable Long id) {
        return listingService.approve(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    @PatchMapping("/admin/moderation/{id}/reject")
    public ListingResponse reject(
            @PathVariable Long id,
            @Valid @RequestBody RejectListingRequest request
    ) {
        return listingService.reject(id, request);
    }

    @GetMapping("/{id}/nearby")
    public NearbyPlacesResponse getNearby(@PathVariable Long id) {
        Listing listing = listingService.getEntityById(id);

        if (listing.getLatitude() == null || listing.getLongitude() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "У объявления нет координат"
            );
        }

        return overpassNearbyService.getNearby(
                listing.getLatitude(),
                listing.getLongitude()
        );
    }

    @GetMapping("/internal/ml/listings")
    @PreAuthorize("hasRole('SERVICE')")
    public List<MlListingResponse> getAllForMl() {
        return listingService.getAllForMl();
    }

    @GetMapping("/internal/{listingId}/owner")
    @PreAuthorize("hasRole('SERVICE')")
    public ListingOwnerResponse getListingOwner(@PathVariable Long listingId) {
        return listingService.getListingOwner(listingId);
    }
}
