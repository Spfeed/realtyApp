import { useEffect, useState } from "react";
import { getListingsByOwner, type Listing } from "../../api/listingApi";
import {
  getMyReviews,
  getReviewsByTarget,
  type ReviewResponse,
} from "../../api/reviewApi";
import { getUserById, type UserProfile } from "../../api/userApi";
import { AverageRating } from "../../components/reviews/AverageRating";
import { ReviewCarousel } from "../../components/reviews/ReviewCarousel";
import "./HostProfilePage.css";
import { createConversation } from "../../api/chatApi";
import { Link, useNavigate, useParams } from "react-router";
import { ProtectedAvatar } from "../../components/ProtecredAvatar";
import { ProtectedImage } from "../../components/ProtectedImage";
import { getListingPhotos, type ListingPhoto } from "../../api/listingPhotoApi";
import { ReviewModal } from "../../components/reviews/ReviewModal";
import { getCurrentUserId, isAuthenticated } from "../../api/authApi";

export function HostProfilePage() {
  const { id } = useParams();

  const [host, setHost] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const [listingMainPhotos, setListingMainPhotos] = useState<
    Record<number, ListingPhoto | null>
  >({});

  const [myHostReview, setMyHostReview] = useState<ReviewResponse | null>(null);

  const navigate = useNavigate();

  async function handleContactHost() {
    if (!requireAuth()) return;
    if (!id || activeListings.length === 0) return;

    try {
      const conversation = await createConversation(
        activeListings[0].id,
        Number(id),
      );

      navigate(`/chats/${conversation.id}`, {
        state: {
          backTo: `/users/${id}`,
          backLabel: "К владельцу",
        },
      });
    } catch (e) {
      console.error("Ошибка создания чата", e);
    }
  }

  async function reloadReviews() {
    if (!id) return;

    const hostId = Number(id);

    const reviewData = await getReviewsByTarget("LANDLORD", hostId);

    let myReviews: ReviewResponse[] = [];

    if (isAuthenticated()) {
      try {
        myReviews = await getMyReviews();
      } catch {
        myReviews = [];
      }
    }

    setReviews(reviewData);

    const existingReview =
      myReviews.find(
        (review) =>
          review.targetType === "LANDLORD" && review.targetId === hostId,
      ) ?? null;

    setMyHostReview(existingReview);
  }

  function requireAuth() {
    if (!isAuthenticated()) {
      navigate("/login");
      return false;
    }

    return true;
  }

  useEffect(() => {
    if (!id) return;

    const hostId = Number(id);

    async function loadPage() {
      try {
        setLoading(true);

        const authenticated = isAuthenticated();

        const [hostData, listingData, reviewData] = await Promise.all([
          getUserById(hostId),
          getListingsByOwner(hostId),
          getReviewsByTarget("LANDLORD", hostId),
        ]);

        let myReviews: ReviewResponse[] = [];

        if (authenticated) {
          try {
            myReviews = await getMyReviews();
          } catch {
            myReviews = [];
          }
        }

        setHost(hostData);
        setListings(listingData);
        setReviews(reviewData);
        const existingReview =
          myReviews.find(
            (review) =>
              review.targetType === "LANDLORD" && review.targetId === hostId,
          ) ?? null;

        setMyHostReview(existingReview);

        const photoEntries = await Promise.all(
          listingData.map(async (listing) => {
            try {
              const photos = await getListingPhotos(listing.id);

              const mainPhoto =
                photos.find((photo) => photo.isMain) ??
                photos.sort((a, b) => a.sortOrder - b.sortOrder)[0] ??
                null;

              return [listing.id, mainPhoto] as const;
            } catch {
              return [listing.id, null] as const;
            }
          }),
        );

        console.log("LANDLORD reviews on page load:", reviewData);

        setListingMainPhotos(Object.fromEntries(photoEntries));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка загрузки профиля");
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [id]);

  if (loading) return <p className="host-profile-loading">Загрузка...</p>;
  if (error) return <p className="host-profile-error">{error}</p>;
  if (!host)
    return <p className="host-profile-error">Пользователь не найден</p>;

  const activeListings = listings.filter(
    (listing) => listing.status === "ACTIVE",
  );
  const rentedListings = listings.filter(
    (listing) => listing.status === "RENTED",
  );

  const currentUserId = getCurrentUserId();
  const isOwnProfile = currentUserId === Number(id);

  return (
    <main className="page host-profile-page">
      <div className="page-container host-profile-container">
      <section className="host-profile-card">
        <div className="host-profile-main">
          <ProtectedAvatar
            avatarUrl={host.avatarUrl}
            fallback={host.name[0]}
            className="host-avatar"
            imgClassName="host-avatar-img"
          />

          <div>
            <h1>
              {host.name} {host.surname}
            </h1>
            <p>Владелец недвижимости на StayVille</p>
          </div>
        </div>

        <div className="host-stats">
          <div className="host-stat-card">
            <span>Объявлений</span>
            <strong>{listings.length}</strong>
          </div>

          <div className="host-rating-card">
            <span>Средний рейтинг</span>
            <strong>
              <AverageRating reviews={reviews} />
            </strong>
          </div>
        </div>

        {!isOwnProfile && (
          <button
            type="button"
            className="host-contact-button"
            onClick={handleContactHost}
            disabled={activeListings.length === 0}
          >
            Написать
          </button>
        )}
        {!isOwnProfile && (
          <button
            type="button"
            className="host-review-button"
            onClick={() => {
              if (!requireAuth()) return;
              setIsReviewModalOpen(true);
            }}
          >
            {myHostReview ? "Редактировать отзыв" : "Оставить отзыв"}
          </button>
        )}
      </section>

      <section className="host-section">
        <div className="host-section-header">
          <h2>Актуальные объявления</h2>
          <span>Показано {activeListings.length}</span>
        </div>

        {activeListings.length > 0 ? (
          <div className="host-listings-grid">
            {activeListings.map((listing) => (
              <HostListingCard
                key={listing.id}
                listing={listing}
                photo={listingMainPhotos[listing.id]}
              />
            ))}
          </div>
        ) : (
          <p className="host-empty-card">Активных объявлений пока нет</p>
        )}
      </section>

      <section className="host-section">
        <h2>Сданные в аренду</h2>

        {rentedListings.length > 0 ? (
          <div className="host-rented-row">
            {rentedListings.map((listing) => (
              <HostListingCard
                key={listing.id}
                listing={listing}
                photo={listingMainPhotos[listing.id]}
                muted
              />
            ))}
          </div>
        ) : (
          <p className="host-empty-card">Сданных объявлений пока нет</p>
        )}
      </section>

      <section className="host-section">
        <h2>Отзывы гостей</h2>

        {reviews.length > 0 ? (
          <ReviewCarousel reviews={reviews} />
        ) : (
          <p className="host-empty-card">Пока нет отзывов о владельце</p>
        )}
      </section>
      {!isOwnProfile && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          targetType="LANDLORD"
          targetId={Number(id)}
          title={`${host.name} ${host.surname}`}
          subtitle="Владелец недвижимости на StayVille"
          avatarUrl={host.avatarUrl}
          fallback={host.name[0]}
          reviews={reviews}
          reviewToEdit={myHostReview}
          onSuccess={reloadReviews}
        />
      )}
      </div>
    </main>
  );
}

type HostListingCardProps = {
  listing: Listing;
  photo?: ListingPhoto | null;
  muted?: boolean;
};

function HostListingCard({
  listing,
  photo,
  muted = false,
}: HostListingCardProps) {
  const content = (
    <>
      <ProtectedImage
        src={photo?.url}
        alt={listing.title}
        className="host-listing-image"
        placeholderClassName="host-listing-image"
      />

      <div className="host-listing-content">
        <div className="host-listing-top">
          <h3>{listing.title}</h3>
          <strong>{listing.price.toLocaleString("ru-RU")} ₽</strong>
        </div>

        <p>
          {listing.cityName}
          {listing.districtName ? `, ${listing.districtName}` : ""} ·{" "}
          {listing.area} м²
        </p>

        <div className="host-listing-meta">
          <span>
            {listing.utilitiesIncluded ? "ЖКХ включены" : "ЖКХ отдельно"}
          </span>
          <span>Залог {listing.depositAmount.toLocaleString("ru-RU")} ₽</span>
          <span>{muted ? "Сдано" : "Активно"}</span>
        </div>
      </div>
    </>
  );

  if (muted) {
    return (
      <article className="host-listing-card host-listing-card--muted">
        {content}
      </article>
    );
  }

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="host-listing-card host-listing-link"
    >
      {content}
    </Link>
  );
}
