package com.realty_app.user_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateUserProfileRequest {
    @NotBlank
    private String surname;

    @NotBlank
    private String name;

    private String patronymic;

    @NotBlank
    private String phone;
}
