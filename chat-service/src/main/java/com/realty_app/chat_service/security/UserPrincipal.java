package com.realty_app.chat_service.security;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserPrincipal {
    private Long userId;
    private String email;
    private String role;
}
