package com.realty_app.listing_service.controller;

import com.realty_app.listing_service.dto.ListingPhotoResponse;
import com.realty_app.listing_service.security.UserPrincipal;
import com.realty_app.listing_service.service.ListingPhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ListingPhotoController {

    private final ListingPhotoService listingPhotoService;

    @PostMapping("/listings/{listingId}/photos")
    public List<ListingPhotoResponse> uploadPhotos(
            @PathVariable Long listingId,
            @RequestParam("files") List<MultipartFile> files,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        return listingPhotoService.uploadPhotos(
                listingId,
                files,
                principal.getUserId(),
                principal.getRole()
        );
    }

    @GetMapping("/listings/{listingId}/photos")
    public List<ListingPhotoResponse> getPhotos(@PathVariable Long listingId) {
        return listingPhotoService.getPhotos(listingId);
    }

    @DeleteMapping("/listings/photos/{photoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePhoto(
            @PathVariable Long photoId,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        listingPhotoService.deletePhoto(
                photoId,
                principal.getUserId(),
                principal.getRole()
        );
    }

    @PatchMapping("/listings/photos/{photoId}/main")
    public ListingPhotoResponse setMainPhoto(
            @PathVariable Long photoId,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        return listingPhotoService.setMainPhoto(
                photoId,
                principal.getUserId(),
                principal.getRole()
        );
    }
}