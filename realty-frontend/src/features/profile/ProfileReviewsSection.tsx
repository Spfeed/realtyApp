import { useEffect, useState } from "react";
import { getListingById } from "../../api/listingApi";
import {
  getMyReviews,
  getReviewsByTarget,
  type ReviewResponse,
} from "../../api/reviewApi";
import { getUserById } from "../../api/userApi";
import { ReviewModal } from "../../components/reviews/ReviewModal";
import { getListingPhotos } from "../../api/listingPhotoApi";

type ReviewTargetInfo = {
  title: string;
  subtitle: string;
  avatarUrl?: string | null;
  fallback: string;
};

export function ProfileReviewsSection() {
  const [myReviews, setMyReviews] = useState<ReviewResponse[]>([]);
  const [reviewTargets, setReviewTargets] = useState<
    Record<number, ReviewTargetInfo>
  >({});
  const [reviewTargetReviews, setReviewTargetReviews] = useState<
    Record<number, ReviewResponse[]>
  >({});

  const [reviewToEdit, setReviewToEdit] = useState<ReviewResponse | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  async function loadMyReviews() {
    setLoading(true);

    const reviews = await getMyReviews();
    setMyReviews(reviews);

    const targetEntries = await Promise.all(
      reviews.map(async (review) => {
        try {
          if (review.targetType === "LISTING") {
            const listing = await getListingById(review.targetId);

            let mainPhotoUrl: string | null = null;

            try {
              const photos = await getListingPhotos(review.targetId);

              const mainPhoto =
                photos.find((photo) => photo.isMain) ??
                photos.sort((a, b) => a.sortOrder - b.sortOrder)[0] ??
                null;

              mainPhotoUrl = mainPhoto?.url ?? null;
            } catch {
              mainPhotoUrl = null;
            }

            return [
              review.id,
              {
                title: listing.title,
                subtitle: `${listing.cityName}, ${listing.street} ${listing.houseNumber}`,
                avatarUrl: mainPhotoUrl,
                fallback: listing.title[0] ?? "О",
              },
            ] as const;
          }

          const user = await getUserById(review.targetId);

          return [
            review.id,
            {
              title: `${user.name} ${user.surname}`,
              subtitle: "Владелец недвижимости на StayVille",
              avatarUrl: user.avatarUrl,
              fallback: user.name[0] ?? "П",
            },
          ] as const;
        } catch {
          return [
            review.id,
            {
              title:
                review.targetType === "LISTING"
                  ? `Объявление #${review.targetId}`
                  : `Пользователь #${review.targetId}`,
              subtitle: "Данные временно недоступны",
              avatarUrl: null,
              fallback: "?",
            },
          ] as const;
        }
      }),
    );

    const targetReviewsEntries = await Promise.all(
      reviews.map(async (review) => {
        try {
          const targetReviews = await getReviewsByTarget(
            review.targetType,
            review.targetId,
          );

          return [review.id, targetReviews] as const;
        } catch {
          return [review.id, []] as const;
        }
      }),
    );

    setReviewTargets(Object.fromEntries(targetEntries));
    setReviewTargetReviews(Object.fromEntries(targetReviewsEntries));
    setLoading(false);
  }

  useEffect(() => {
    loadMyReviews().catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="profile-empty">Загрузка отзывов...</p>;
  }

  return (
    <>
      {myReviews.length > 0 ? (
        <div className="profile-reviews-grid">
          {myReviews.map((review) => {
            const target = reviewTargets[review.id];

            return (
              <article key={review.id} className="profile-review-card">
                <div className="profile-review-top">
                  <div>
                    <span className="profile-review-type">
                      {review.targetType === "LISTING"
                        ? "Отзыв об объявлении"
                        : "Отзыв о владельце"}
                    </span>

                    <h3>{target?.title ?? "Цель отзыва"}</h3>
                    <p>{target?.subtitle ?? "Данные загружаются"}</p>
                  </div>

                  <strong>★ {review.rating}</strong>
                </div>

                <p className="profile-review-text">
                  {review.text || "Без текста"}
                </p>

                <div className="profile-review-footer">
                  <span>
                    {new Date(review.createdAt).toLocaleDateString("ru-RU")}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setReviewToEdit(review);
                      setIsReviewModalOpen(true);
                    }}
                  >
                    Редактировать
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="profile-empty">Вы пока не оставляли отзывы</p>
      )}

      {reviewToEdit && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setReviewToEdit(null);
          }}
          targetType={reviewToEdit.targetType}
          targetId={reviewToEdit.targetId}
          title={reviewTargets[reviewToEdit.id]?.title ?? "Цель отзыва"}
          subtitle={reviewTargets[reviewToEdit.id]?.subtitle ?? ""}
          avatarUrl={reviewTargets[reviewToEdit.id]?.avatarUrl}
          fallback={reviewTargets[reviewToEdit.id]?.fallback ?? "?"}
          reviews={reviewTargetReviews[reviewToEdit.id] ?? []}
          reviewToEdit={reviewToEdit}
          onSuccess={async () => {
            await loadMyReviews();
            setReviewToEdit(null);
          }}
        />
      )}
    </>
  );
}
