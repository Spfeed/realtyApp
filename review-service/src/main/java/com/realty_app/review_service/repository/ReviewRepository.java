package com.realty_app.review_service.repository;

import com.realty_app.review_service.model.Review;
import com.realty_app.review_service.model.ReviewTargetType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review,Long> {

    List<Review> findByAuthorId(Long authorId);

    List<Review> findByTargetTypeAndTargetId(ReviewTargetType targetType, Long targetId);

    boolean existsByAuthorIdAndTargetTypeAndTargetId(
            Long authorId,
            ReviewTargetType targetType,
            Long targetId
    );
}
