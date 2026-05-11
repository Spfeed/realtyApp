package com.realty_app.user_service.controller;

import com.realty_app.user_service.dto.CreateUserProfileRequest;
import com.realty_app.user_service.dto.UpdateUserProfileRequest;
import com.realty_app.user_service.dto.UserProfileResponse;
import com.realty_app.user_service.model.UserProfile;
import com.realty_app.user_service.security.UserPrincipal;
import com.realty_app.user_service.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/users/profile")
@RequiredArgsConstructor
public class UserProfileController {
    private final UserProfileService userProfileService;

    @PostMapping
    public UserProfileResponse create(
            @Valid @RequestBody CreateUserProfileRequest request,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        return userProfileService.create(request, principal.getUserId());
    }

    @GetMapping("/me")
    public UserProfileResponse getMe(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return userProfileService.getMe(principal.getUserId());
    }

    @GetMapping("/{authUserId}")
    public UserProfileResponse getByAuthUserId(@PathVariable Long authUserId) {
        return  userProfileService.getByAuthUserId(authUserId);
    }

    @PatchMapping("/me")
    public UserProfileResponse updateMe(
            @Valid @RequestBody UpdateUserProfileRequest request,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        return userProfileService.updateMe(request, principal.getUserId());
    }

    @PostMapping("/avatar")
    public UserProfileResponse uploadAvatar(
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        return userProfileService.uploadAvatar(file, principal.getUserId());
    }

    @DeleteMapping("/avatar")
    public UserProfileResponse deleteAvatar(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        return userProfileService.deleteAvatar(principal.getUserId());
    }
}
