import { RatingStars } from "./RatingStars";
import "./ReviewCard.css";
import { ProtectedAvatar } from "../ProtecredAvatar";

export type Review = {
  id: number;
  authorId: number;
  rating: number;
  text: string | null;
  createdAt: string;
};

type Props = {
  review: Review;
  authorName?: string;
  authorAvatarUrl?: string | null;
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function ReviewCard({ review, authorName, authorAvatarUrl }: Props) {
  const fallback = authorName?.[0] ?? "П";

  return (
    <div className="review-card">
      <div className="review-card-header">
        <div className="review-card-user">
          <ProtectedAvatar
            avatarUrl={authorAvatarUrl}
            fallback={fallback}
            className="review-avatar"
            imgClassName="review-avatar-img"
          />
          <div>
            <span className="review-name">
              {authorName ?? `Пользователь #${review.authorId}`}
            </span>
            <span className="review-date">{formatDate(review.createdAt)}</span>
          </div>
        </div>

        <RatingStars value={review.rating} readonly size="sm" />
      </div>

      {review.text && <p className="review-text">{review.text}</p>}
    </div>
  );
}