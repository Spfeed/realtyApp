import { useEffect, useState } from "react";
import {
  getMyReviews,
  getReviewsByTarget,
  type ReviewResponse,
  type ReviewTargetType,
} from "../../api/reviewApi";
import { ReviewCard } from "./ReviewCard";
import "./ReviewList.css";

type Props = {
  targetType?: ReviewTargetType;
  targetId?: number;
  mode?: "target" | "my";
};

export function ReviewList({ targetType, targetId, mode = "target" }: Props) {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      setError("");

      try {
        if (mode === "my") {
          const data = await getMyReviews();
          setReviews(data);
          return;
        }

        if (!targetType || !targetId) {
          setReviews([]);
          return;
        }

        const data = await getReviewsByTarget(targetType, targetId);
        setReviews(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка загрузки отзывов");
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, [targetType, targetId, mode]);

  if (loading) {
    return <p className="review-empty">Загрузка отзывов...</p>;
  }

  if (error) {
    return <p className="review-error">{error}</p>;
  }

  if (reviews.length === 0) {
    return <p className="review-empty">Пока нет отзывов</p>;
  }

  return (
    <div className="review-list">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}