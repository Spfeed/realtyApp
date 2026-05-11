import type { ReviewResponse } from "../../api/reviewApi";

type AverageRatingProps = {
  reviews: ReviewResponse[];
  compact?: boolean;
};

function getReviewWord(count: number) {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return "отзывов";
  if (lastDigit === 1) return "отзыв";
  if (lastDigit >= 2 && lastDigit <= 4) return "отзыва";

  return "отзывов";
}

export function AverageRating({ reviews, compact = false }: AverageRatingProps) {
  if (reviews.length === 0) {
    return <span>{compact ? "Нет отзывов" : "Пока нет отзывов"}</span>;
  }

  const average =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <span>
      ★ {average.toFixed(1)}
      {!compact && ` · ${reviews.length} ${getReviewWord(reviews.length)}`}
    </span>
  );
}