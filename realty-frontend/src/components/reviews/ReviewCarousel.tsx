import { useEffect, useState } from "react";
import type { ReviewResponse } from "../../api/reviewApi";
import { getUserById } from "../../api/userApi";
import { ReviewCard } from "./ReviewCard";
import "./ReviewCarousel.css";

type ReviewCarouselProps = {
  reviews: ReviewResponse[];
};

type ReviewAuthor = {
  name: string;
  avatarUrl?: string | null;
};

const VISIBLE_COUNT = 3;

export function ReviewCarousel({ reviews }: ReviewCarouselProps) {
  const [startIndex, setStartIndex] = useState(0);
  const [authors, setAuthors] = useState<Record<number, ReviewAuthor>>({});

  useEffect(() => {
    async function loadAuthors() {
      const uniqueAuthorIds = Array.from(
        new Set(reviews.map((review) => review.authorId)),
      );

      const entries = await Promise.all(
        uniqueAuthorIds.map(async (authorId) => {
          try {
            const user = await getUserById(authorId);
            return [
              authorId,
              {
                name: `${user.name} ${user.surname}`,
                avatarUrl: user.avatarUrl,
              },
            ] as const;
          } catch {
            return [
              authorId,
              {
                name: `Пользователь #${authorId}`,
                avatarUrl: null,
              },
            ] as const;
          }
        }),
      );

      setAuthors(Object.fromEntries(entries));
    }

    if (reviews.length > 0) {
      loadAuthors();
    } else {
      setAuthors({});
    }
  }, [reviews]);

  const canGoPrev = startIndex > 0;
  const canGoNext = startIndex + VISIBLE_COUNT < reviews.length;

  const visibleReviews = reviews.slice(startIndex, startIndex + VISIBLE_COUNT);

  return (
    <div className="review-carousel">
      <button
        type="button"
        className="review-carousel-arrow review-carousel-arrow--left"
        onClick={() => setStartIndex((prev) => Math.max(prev - 1, 0))}
        disabled={!canGoPrev}
        aria-label="Предыдущие отзывы"
      >
        <img src="/icons/left_carousel.svg" alt="" />
      </button>

      <div className="review-carousel-track">
        {visibleReviews.map((review) => {
          const author = authors[review.authorId];
          return (
            <ReviewCard
              key={review.id}
              review={review}
              authorName={author?.name}
              authorAvatarUrl={author?.avatarUrl}
            />
          );
        })}
      </div>

      <button
        type="button"
        className="review-carousel-arrow review-carousel-arrow--right"
        onClick={() =>
          setStartIndex((prev) =>
            Math.min(prev + 1, reviews.length - VISIBLE_COUNT),
          )
        }
        disabled={!canGoNext}
        aria-label="Следующие отзывы"
      >
        <img src="/icons/right_carousel.svg" alt="" />
      </button>
    </div>
  );
}
