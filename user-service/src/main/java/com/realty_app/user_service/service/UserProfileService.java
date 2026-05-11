package com.realty_app.user_service.service;

import com.realty_app.user_service.dto.CreateUserProfileRequest;
import com.realty_app.user_service.dto.UpdateUserProfileRequest;
import com.realty_app.user_service.dto.UserProfileResponse;
import com.realty_app.user_service.model.UserProfile;
import com.realty_app.user_service.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import java.nio.file.StandardCopyOption;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;

    @Value("${media.upload-path}")
    private String uploadPath;

    @Value("${media.public-url-prefix}")
    private String publicUrlPrefix;

    //Создание профиля пользователя
    public UserProfileResponse create(CreateUserProfileRequest request, Long authUserId) {
        if (userProfileRepository.existsByAuthUserId(authUserId)) {
            throw new RuntimeException("Профиль пользователя уже существует.");
        }

        UserProfile profile = UserProfile.builder()
                .authUserId(authUserId)
                .surname(request.getSurname())
                .name(request.getName())
                .patronymic(request.getPatronymic())
                .phone(request.getPhone())
                .build();

        return toResponse(userProfileRepository.save(profile));
    }

    //Поиск профиля текущего пользователя
    public UserProfileResponse getMe(Long authUserId) {
        UserProfile profile = userProfileRepository.findByAuthUserId(authUserId)
                .orElseThrow(() -> new RuntimeException("Профиль пользователя не найден."));

        return toResponse(profile);
    }

    //Для удобства доп. метод поиска не по текущему пользователю, а по id
    public UserProfileResponse getByAuthUserId(Long authUserId) {
        UserProfile profile = userProfileRepository.findByAuthUserId(authUserId)
                .orElseThrow(() -> new RuntimeException("Профиль пользователя с таким id не найден"));

        return toResponse(profile);
    }

    public UserProfileResponse updateMe(UpdateUserProfileRequest request, Long authUserId) {
        UserProfile profile = userProfileRepository.findByAuthUserId(authUserId)
                .orElseThrow(() -> new RuntimeException("Профиль пользователя не найден."));

        profile.setSurname(request.getSurname());
        profile.setName(request.getName());
        profile.setPatronymic(request.getPatronymic());
        profile.setPhone(request.getPhone());

        return toResponse(userProfileRepository.save(profile));
    }

    public UserProfileResponse uploadAvatar(MultipartFile file, Long authUserId) {
        if (file.isEmpty()) {
            throw new RuntimeException("Файл не выбран.");
        }

        UserProfile profile = userProfileRepository.findByAuthUserId(authUserId)
                .orElseThrow(() -> new RuntimeException("Профиль пользователя не найден."));

        String originalFilename = file.getOriginalFilename();
        String extension = getExtension(originalFilename);

        String filename = "avatar-" + UUID.randomUUID() + extension;

        Path rootDir = Path.of(uploadPath).toAbsolutePath().normalize();
        Path userDir = rootDir.resolve(Path.of("avatars", authUserId.toString()));
        Path filePath = userDir.resolve(filename).normalize();

        try {
            Files.createDirectories(userDir);

            if (profile.getAvatarUrl() != null) {
                deleteFileByUrl(profile.getAvatarUrl());
            }

            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String avatarUrl = publicUrlPrefix + "/avatars/" + authUserId + "/" + filename;
            profile.setAvatarUrl(avatarUrl);

            return toResponse(userProfileRepository.save(profile));
        } catch (IOException e) {
            throw new RuntimeException("Ошибка загрузки аватарки: " + e.getMessage(), e);
        }
    }

    public UserProfileResponse deleteAvatar(Long authUserId) {
        UserProfile profile = userProfileRepository.findByAuthUserId(authUserId)
                .orElseThrow(() -> new RuntimeException("Профиль пользователя не найден."));

        if (profile.getAvatarUrl() != null) {
            deleteFileByUrl(profile.getAvatarUrl());
            profile.setAvatarUrl(null);
        }

        return toResponse(userProfileRepository.save(profile));
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return ".jpg";
        }

        return filename.substring(filename.lastIndexOf("."));
    }

    private void deleteFileByUrl(String url) {
        try {
            String relativePath = url.replace(publicUrlPrefix, "");

            if (relativePath.startsWith("/")) {
                relativePath = relativePath.substring(1);
            }

            Path rootDir = Path.of(uploadPath).toAbsolutePath().normalize();
            Path filePath = rootDir.resolve(relativePath).normalize();

            Files.deleteIfExists(filePath);
        } catch (IOException ignored) {
        }
    }

    //Служебный метод, преобразующий сущность в DTO
    private UserProfileResponse toResponse(UserProfile profile) {
        return UserProfileResponse.builder()
                .id(profile.getId())
                .authUserId(profile.getAuthUserId())
                .surname(profile.getSurname())
                .name(profile.getName())
                .patronymic(profile.getPatronymic())
                .phone(profile.getPhone())
                .avatarUrl(profile.getAvatarUrl())
                .build();
    }
}
