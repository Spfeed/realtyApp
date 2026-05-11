package com.realty_app.listing_service.controller;

import com.realty_app.listing_service.security.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/listings")
public class ListingTestController {

    @GetMapping("/test")
    public String test(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return "Listing-service доступен для: "
                + principal.getEmail()
                + ", userId = " +
                principal.getUserId()
                + ", role = " +
                principal.getRole();
    }
}
