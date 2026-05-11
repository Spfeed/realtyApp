package com.realty_app.review_service.service;

import com.realty_app.review_service.client.ListingClient;
import com.realty_app.review_service.dto.*;
import com.realty_app.review_service.kafka.ReviewEventProducer;
import com.realty_app.review_service.model.Review;
import com.realty_app.review_service.model.ReviewTargetType;
import com.realty_app.review_service.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final ListingClient listingClient;
    private final ReviewEventProducer reviewEventProducer;

    //Создание отзыва
    public ReviewResponse create(CreateReviewRequest request, Long authorId) {

        if (
                request.getTargetType() == ReviewTargetType.LANDLORD
                        && request.getTargetId().equals(authorId)
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Нельзя оставить отзыв самому себе"
            );
        }

        if (request.getTargetType() == ReviewTargetType.LISTING) {
            ListingOwnerResponse listingOwner = listingClient.getListingOwner(request.getTargetId());

            if (listingOwner == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Объявление не найдено"
                );
            }

            if (listingOwner.getOwnerId().equals(authorId)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Нельзя оставить отзыв на своё объявление"
                );
            }
        }

        if (reviewRepository.existsByAuthorIdAndTargetTypeAndTargetId(
                authorId,
                request.getTargetType(),
                request.getTargetId()
        )) {
            throw new RuntimeException("Вы уже оставляли отзыв этому владельцу или объекту.");
        }

        Review review = Review.builder()
                .authorId(authorId)
                .targetType(request.getTargetType())
                .targetId(request.getTargetId())
                .rating(request.getRating())
                .text(request.getText())
                .build();

        Review saved = reviewRepository.save(review);

        if (saved.getTargetType() == ReviewTargetType.LISTING) {
            reviewEventProducer.sendReviewCreated(
                    ReviewEvent.builder()
                            .reviewId(saved.getId())
                            .authorId(saved.getAuthorId())
                            .listingId(saved.getTargetId())
                            .rating(saved.getRating())
                            .build()
            );
        }

        return toResponse(saved);
    }

    //Вывод всех отзывов указанного объекта или владельца
    public List<ReviewResponse> getByTarget(
            ReviewTargetType targetType,
            Long targetId
    ) {
        return reviewRepository.findByTargetTypeAndTargetId(targetType, targetId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    //Отзывы пользователя с id из токена
    public List<ReviewResponse> getMyReviews(Long authorId) {
        return reviewRepository.findByAuthorId(authorId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    //Редактирование отзыва
    public ReviewResponse update(Long reviewId, UpdateReviewRequest request, Long authorId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Отзыв не найден"
                ));
        if (!review.getAuthorId().equals(authorId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Вы можете редактировать только свои отзывы"
            );
        }

        review.setRating(request.getRating());
        review.setText(request.getText());

        Review saved = reviewRepository.save(review);

        if (saved.getTargetType() == ReviewTargetType.LISTING) {
            reviewEventProducer.sendReviewUpdated(
                    ReviewEvent.builder()
                            .reviewId(saved.getId())
                            .authorId(saved.getAuthorId())
                            .listingId(saved.getTargetId())
                            .rating(saved.getRating())
                            .build()
            );
        }

        return toResponse(saved);
    }

    //Удаление отзыва
    public void delete(Long reviewId, Long authorId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Отзыв не найден"
                ));

        if (!review.getAuthorId().equals(authorId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Вы можете удалить только свой отзыв"
            );
        }

        ReviewEvent event = null;

        if (review.getTargetType() == ReviewTargetType.LISTING) {
            event = ReviewEvent.builder()
                    .reviewId(review.getId())
                    .authorId(review.getAuthorId())
                    .listingId(review.getTargetId())
                    .rating(review.getRating())
                    .build();
        }

        reviewRepository.delete(review);
        reviewRepository.flush();

        if (event != null) {
            reviewEventProducer.sendReviewDeleted(event);
        }
    }

    //Служебный метод, превращающий сущность в DTO
    private ReviewResponse toResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .authorId(review.getAuthorId())
                .targetType(review.getTargetType())
                .targetId(review.getTargetId())
                .rating(review.getRating())
                .text(review.getText())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
