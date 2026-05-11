package com.realty_app.listing_service.service;

import com.realty_app.listing_service.dto.ListingPhotoResponse;
import com.realty_app.listing_service.model.Listing;
import com.realty_app.listing_service.model.ListingPhoto;
import com.realty_app.listing_service.repository.ListingPhotoRepository;
import com.realty_app.listing_service.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ListingPhotoService {
    private final ListingRepository listingRepository;
    private final ListingPhotoRepository listingPhotoRepository;

    @Value("${media.upload-path}")
    private String uploadPath;

    @Value("${media.public-url-prefix}")
    private String publicUrlPrefix;

    public List<ListingPhotoResponse> uploadPhotos(
            Long listingId,
            List<MultipartFile> files,
            Long currentUserId,
            String role
    ) {
        if (files == null || files.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Файлы не выбраны."
            );
        }

        Listing listing = getListingOrThrow(listingId);

        checkCanManageListingPhotos(listing, currentUserId, role);

        int startOrder = listingPhotoRepository.countByListingId(listingId);
        boolean hasMainPhoto = listingPhotoRepository.existsByListingIdAndIsMainTrue(listingId);

        Path rootDir = Path.of(uploadPath).toAbsolutePath().normalize();
        Path listingDir = rootDir.resolve(Path.of("listings", listingId.toString()));

        try {
            Files.createDirectories(listingDir);

            for (int i = 0; i < files.size(); i++) {
                MultipartFile file = files.get(i);

                if (file.isEmpty()) {
                    continue;
                }

                String extension = getExtension(file.getOriginalFilename());
                String filename = "listing-" + UUID.randomUUID() + extension;

                Path filePath = listingDir.resolve(filename).normalize();

                Files.copy(
                        file.getInputStream(),
                        filePath,
                        StandardCopyOption.REPLACE_EXISTING
                );

                String url = publicUrlPrefix + "/listings/" + listingId + "/" + filename;

                ListingPhoto photo = ListingPhoto.builder()
                        .listingId(listingId)
                        .url(url)
                        .sortOrder(startOrder + i)
                        .isMain(!hasMainPhoto && i == 0)
                        .build();

                listingPhotoRepository.save(photo);
            }

            return getPhotos(listingId);
        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Ошибка загрузки фото: " + e.getMessage(),
                    e
            );
        }
    }

    public List<ListingPhotoResponse> getPhotos(Long listingId) {
        return listingPhotoRepository.findByListingIdOrderBySortOrderAscIdAsc(listingId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public void deletePhoto(Long photoId, Long currentUserId, String role) {
        ListingPhoto photo = listingPhotoRepository.findById(photoId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Фото не найдено."
                ));

        Listing listing = getListingOrThrow(photo.getListingId());

        checkCanManageListingPhotos(listing, currentUserId, role);

        boolean wasMainPhoto = Boolean.TRUE.equals(photo.getIsMain());
        Long listingId = photo.getListingId();

        deleteFileByUrl(photo.getUrl());
        listingPhotoRepository.delete(photo);

        if (wasMainPhoto) {
            setFirstAvailablePhotoAsMain(listingId);
        }
    }

    public ListingPhotoResponse setMainPhoto(Long photoId, Long currentUserId, String role) {
        ListingPhoto selectedPhoto = listingPhotoRepository.findById(photoId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Фото не найдено."
                ));

        Listing listing = getListingOrThrow(selectedPhoto.getListingId());

        checkCanManageListingPhotos(listing, currentUserId, role);

        List<ListingPhoto> photos = listingPhotoRepository.findByListingId(
                selectedPhoto.getListingId()
        );

        photos.forEach(photo -> photo.setIsMain(photo.getId().equals(photoId)));

        listingPhotoRepository.saveAll(photos);

        selectedPhoto.setIsMain(true);

        return toResponse(selectedPhoto);
    }

    private Listing getListingOrThrow(Long listingId) {
        return listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Объявление не найдено."
                ));
    }

    private boolean isModeratorOrAdmin(String role) {
        return "ADMIN".equals(role) || "MODERATOR".equals(role);
    }

    private void checkCanManageListingPhotos(
            Listing listing,
            Long currentUserId,
            String role
    ) {
        if (!listing.getOwnerId().equals(currentUserId) && !isModeratorOrAdmin(role)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "У вас нет прав на управление фото этого объявления."
            );
        }
    }

    private void setFirstAvailablePhotoAsMain(Long listingId) {
        List<ListingPhoto> photos =
                listingPhotoRepository.findByListingIdOrderBySortOrderAscIdAsc(listingId);

        if (photos.isEmpty()) {
            return;
        }

        ListingPhoto newMainPhoto = photos.get(0);
        newMainPhoto.setIsMain(true);

        listingPhotoRepository.save(newMainPhoto);
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

    private ListingPhotoResponse toResponse(ListingPhoto photo) {
        return ListingPhotoResponse.builder()
                .id(photo.getId())
                .listingId(photo.getListingId())
                .url(photo.getUrl())
                .sortOrder(photo.getSortOrder())
                .isMain(photo.getIsMain())
                .build();
    }
}