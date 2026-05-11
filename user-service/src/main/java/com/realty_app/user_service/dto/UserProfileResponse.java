package com.realty_app.user_service.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserProfileResponse {
    private Long id;
    private Long authUserId;
    private String surname;
    private String name;
    private String patronymic;
    private String phone;
    private String avatarUrl;
}
