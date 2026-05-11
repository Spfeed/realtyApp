import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  createApplication,
  getMyApplicationByListingId,
  type RentalApplication,
} from "../../api/applicationApi";
import {
  getNearbyPlaces,
  getListingById,
  type NearbyPlacesResponse,
  type Listing,
} from "../../api/listingApi";
import { getUserById, type UserProfile } from "../../api/userApi";
import "./ListingDetailsPage.css";
import {
  getMyReviews,
  getReviewsByTarget,
  type ReviewResponse,
} from "../../api/reviewApi";
import { ReviewCarousel } from "../../components/reviews/ReviewCarousel";
import { createConversation } from "../../api/chatApi";
import { ProtectedAvatar } from "../../components/ProtecredAvatar";
import { getListingPhotos, type ListingPhoto } from "../../api/listingPhotoApi";
import { ListingPhotoGallery } from "./ListingPhotoGallery";
import { AverageRating } from "../../components/reviews/AverageRating";
import { ReviewModal } from "../../components/reviews/ReviewModal";
import { getCurrentUserId, isAuthenticated } from "../../api/authApi";
import { CreateListingModal } from "./CreateListingModal";
import { ListingMap } from "../../components/ListingMap";
import { trackListingEvent } from "../../api/recommendationApi";

type NearbyPlaceView = {
  name: string;
  distanceMeters: number;
  latitude: number;
  longitude: number;
};

type NearbyGroupView = {
  key: string;
  title: string;
  places: NearbyPlaceView[];
};

function formatDistance(meters: number) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} км`;
  }

  return `${meters} м`;
}

function NearbyGroup({ group }: { group: NearbyGroupView }) {
  return (
    <div className="listing-nearby-group">
      <h4>{group.title}</h4>

      {group.places.slice(0, 3).map((place) => (
        <p key={`${place.name}-${place.distanceMeters}`}>
          {place.name} — {formatDistance(place.distanceMeters)}
        </p>
      ))}
    </div>
  );
}

function NearbyPlacesModal({
  groups,
  onClose,
}: {
  groups: NearbyGroupView[];
  onClose: () => void;
}) {
  return (
    <div className="listing-nearby-modal-backdrop" onClick={onClose}>
      <div
        className="listing-nearby-modal listing-nearby-modal--large"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="listing-nearby-modal-header">
          <div>
            <span className="listing-muted">Инфраструктура</span>
            <h3>Все места рядом</h3>
          </div>

          <button type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="listing-nearby-modal-groups">
          {groups.map((group) => (
            <section key={group.key} className="listing-nearby-modal-group">
              <h4>{group.title}</h4>

              <div className="listing-nearby-modal-list">
                {group.places.map((place) => (
                  <div
                    key={`${group.key}-${place.name}-${place.distanceMeters}`}
                    className="listing-nearby-modal-item"
                  >
                    <span>{place.name}</span>
                    <b>{formatDistance(place.distanceMeters)}</b>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ListingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState<Listing | null>(null);
  const [owner, setOwner] = useState<UserProfile | null>(null);

  const [error, setError] = useState("");
  const [applicationMessage, setApplicationMessage] = useState("");
  const [creatingApplication, setCreatingApplication] = useState(false);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [myListingReview, setMyListingReview] = useState<ReviewResponse | null>(
    null,
  );
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [myApplication, setMyApplication] = useState<RentalApplication | null>(
    null,
  );
  const [photos, setPhotos] = useState<ListingPhoto[]>([]);
  const [ownerReviews, setOwnerReviews] = useState<ReviewResponse[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isEditListingModalOpen, setIsEditListingModalOpen] = useState(false);

  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlacesResponse | null>(
    null,
  );
  const [nearbyLoading, setNearbyLoading] = useState(false);

  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState(false);

  const viewTrackedListingIdRef = useRef<number | null>(null);

  const [photoViewTracked, setPhotoViewTracked] = useState(false);
  const [mapViewTracked, setMapViewTracked] = useState(false);

  useEffect(() => {
    if (!id) return;

    getListingById(Number(id))
      .then(setListing)
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    setPhotoViewTracked(false);
    setMapViewTracked(false);
  }, [listing?.id]);

  useEffect(() => {
    if (!listing) return;

    const currentUserId = getCurrentUserId();

    if (currentUserId === listing.ownerId) return;

    if (viewTrackedListingIdRef.current === listing.id) return;

    viewTrackedListingIdRef.current = listing.id;

    trackListingEvent(listing.id, "VIEW").catch(() => {});
  }, [listing?.id]);

  useEffect(() => {
    if (!listing) return;

    const authenticated = isAuthenticated();

    setReviewsLoading(true);

    getUserById(listing.ownerId)
      .then(setOwner)
      .catch(() => {});

    getReviewsByTarget("LISTING", listing.id)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));

    getListingPhotos(listing.id)
      .then(setPhotos)
      .catch(() => setPhotos([]));

    getReviewsByTarget("LANDLORD", listing.ownerId)
      .then(setOwnerReviews)
      .catch(() => setOwnerReviews([]));

    setNearbyLoading(true);

    getNearbyPlaces(listing.id)
      .then(setNearbyPlaces)
      .catch(() => setNearbyPlaces(null))
      .finally(() => setNearbyLoading(false));

    if (authenticated) {
      getMyApplicationByListingId(listing.id)
        .then(setMyApplication)
        .catch(() => setMyApplication(null));

      getMyReviews()
        .then((myReviews) => {
          const existingReview =
            myReviews.find(
              (review) =>
                review.targetType === "LISTING" &&
                review.targetId === listing.id,
            ) ?? null;

          setMyListingReview(existingReview);
        })
        .catch(() => setMyListingReview(null));
    } else {
      setMyApplication(null);
      setMyListingReview(null);
    }
  }, [listing]);

  async function handleCreateApplication() {
    if (!requireAuth()) return;
    if (!listing) return;

    setCreatingApplication(true);
    setApplicationMessage("");

    try {
      const application = await createApplication(listing.id);
      setMyApplication(application);

      if (application.conversationId) {
        navigate(`/chats/${application.conversationId}`, {
          state: {
            backTo: `/listings/${listing.id}`,
            backLabel: "К объявлению",
          },
        });
      } else {
        setApplicationMessage("Чат создаётся, подождите...");
      }

      setTimeout(async () => {
        try {
          const updated = await createApplication(listing.id);

          if (updated.conversationId) {
            navigate(`/chats/${updated.conversationId}`, {
              state: {
                backTo: `/listings/${listing.id}`,
                backLabel: "К объявлению",
              },
            });
          }
        } catch {}
      }, 2000);
    } catch (e) {
      setApplicationMessage(
        e instanceof Error ? e.message : "Ошибка создания заявки",
      );
    } finally {
      setCreatingApplication(false);
    }
  }

  async function handleOpenConversation() {
    if (!requireAuth()) return;
    if (!listing) return;

    try {
      trackListingEvent(listing.id, "CONTACT_OWNER").catch(() => {});

      const conversation = await createConversation(
        listing.id,
        listing.ownerId,
      );
      navigate(`/chats/${conversation.id}`, {
        state: {
          backTo: `/listings/${listing.id}`,
          backLabel: "К объявлению",
        },
      });
    } catch (e) {
      setApplicationMessage(
        e instanceof Error ? e.message : "Ошибка открытия чата",
      );
    }
  }

  async function reloadListingReviews() {
    if (!listing) return;

    const [reviewData, myReviews] = await Promise.all([
      getReviewsByTarget("LISTING", listing.id),
      getMyReviews(),
    ]);

    setReviews(reviewData);

    const existingReview =
      myReviews.find(
        (review) =>
          review.targetType === "LISTING" && review.targetId === listing.id,
      ) ?? null;

    setMyListingReview(existingReview);
  }

  async function reloadListingDetails() {
    if (!listing) return;

    const updatedListing = await getListingById(listing.id);
    setListing(updatedListing);

    const updatedPhotos = await getListingPhotos(listing.id);
    setPhotos(updatedPhotos);
  }

  if (error) return <p className="listing-details-error">{error}</p>;
  if (!listing) return <p className="listing-details-loading">Загрузка...</p>;

  const currentUserId = getCurrentUserId();
  const isOwnListing = currentUserId === listing.ownerId;

  const ownerName = owner
    ? `${owner.name} ${owner.surname?.[0] ?? ""}.`
    : `Пользователь #${listing.ownerId}`;

  const averageListingRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  const reviewsCountText = `${reviews.length} ${getReviewWord(reviews.length)}`;
  const listingAddress = `${listing.cityName}${
    listing.districtName ? `, ${listing.districtName}` : ""
  }, ${listing.street}, ${listing.houseNumber}`;

  const allNearbyGroups: NearbyGroupView[] = nearbyPlaces
    ? [
        { key: "schools", title: "🏫 Школы", places: nearbyPlaces.schools },
        {
          key: "kindergartens",
          title: "🧸 Детские сады",
          places: nearbyPlaces.kindergartens,
        },
        {
          key: "universities",
          title: "🎓 Вузы и колледжи",
          places: nearbyPlaces.universities,
        },
        {
          key: "hospitals",
          title: "🏥 Медицина",
          places: nearbyPlaces.hospitals,
        },
        {
          key: "pharmacies",
          title: "💊 Аптеки",
          places: nearbyPlaces.pharmacies,
        },
        { key: "shops", title: "🛒 Магазины", places: nearbyPlaces.shops },
        {
          key: "transport",
          title: "🚌 Транспорт",
          places: nearbyPlaces.transport,
        },
        { key: "parks", title: "🌳 Парки", places: nearbyPlaces.parks },
        { key: "food", title: "🍽 Еда", places: nearbyPlaces.food },
      ]
        .filter((group) => group.places.length > 0)
        .map((group) => ({
          ...group,
          places: [...group.places].sort(
            (a, b) => a.distanceMeters - b.distanceMeters,
          ),
        }))
        .sort((a, b) => {
          const aMin = a.places[0]?.distanceMeters ?? Number.MAX_SAFE_INTEGER;
          const bMin = b.places[0]?.distanceMeters ?? Number.MAX_SAFE_INTEGER;

          return aMin - bMin;
        })
    : [];

  const previewNearbyGroups = allNearbyGroups.slice(0, 3);

  function getReviewWord(count: number) {
    const lastTwoDigits = count % 100;
    const lastDigit = count % 10;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return "отзывов";
    }

    if (lastDigit === 1) {
      return "отзыв";
    }

    if (lastDigit >= 2 && lastDigit <= 4) {
      return "отзыва";
    }

    return "отзывов";
  }

  const mapNearbyPlaces = previewNearbyGroups.flatMap((group) =>
    group.places.slice(0, 2).map((place) => ({
      ...place,
      categoryTitle: group.title,
    })),
  );

  function requireAuth() {
    if (!isAuthenticated()) {
      navigate("/login");
      return false;
    }

    return true;
  }

  return (
    <main className="page listing-details-page">
      <div className="page-container listing-details-container">
        <section className="listing-details-layout">
          <section className="listing-gallery-card">
            <ListingPhotoGallery
              photos={photos}
              onPhotoView={() => {
                if (photoViewTracked) return;

                setPhotoViewTracked(true);
                trackListingEvent(listing.id, "VIEW_PHOTOS").catch(() => {});
              }}
            />

            <div className="listing-gallery-info">
              <div className="listing-price-card">
                <div>
                  <span className="listing-muted">Цена</span>
                  <strong>
                    {listing.price.toLocaleString("ru-RU")} ₽ / месяц
                  </strong>
                </div>

                <div className="listing-rating-preview">
                  <span>★</span>
                  <b>
                    {reviews.length > 0 ? averageListingRating.toFixed(1) : "—"}
                  </b>
                  <small>
                    {reviews.length > 0
                      ? `(${reviewsCountText})`
                      : "Нет отзывов"}
                  </small>
                </div>

                {isOwnListing && (
                  <button
                    type="button"
                    className="listing-edit-button"
                    onClick={() => setIsEditListingModalOpen(true)}
                  >
                    Редактировать объявление
                  </button>
                )}

                {!isOwnListing && (
                  <>
                    {listing.status === "ACTIVE" && (
                      <button
                        type="button"
                        className={`listing-primary-button ${
                          myApplication
                            ? "listing-primary-button--disabled"
                            : ""
                        }`}
                        onClick={handleCreateApplication}
                        disabled={creatingApplication || Boolean(myApplication)}
                      >
                        {myApplication
                          ? "Заявка уже подана"
                          : creatingApplication
                            ? "Отправляем..."
                            : "Подать заявку"}
                      </button>
                    )}

                    <button
                      type="button"
                      className="listing-secondary-button"
                      onClick={handleOpenConversation}
                    >
                      Написать владельцу
                    </button>
                  </>
                )}

                {applicationMessage && (
                  <p className="listing-application-message">
                    {applicationMessage}
                  </p>
                )}
              </div>

              <div className="listing-facts-card">
                <span className="listing-muted">Характеристики</span>

                <div className="listing-facts-grid">
                  <span>📐 {listing.area} м²</span>
                  <span>🏙 {listing.cityName}</span>
                  <span>
                    🏢 Этаж:{" "}
                    {listing.floor != null ? listing.floor : "не указан"}
                  </span>
                  <span>🏗 Лифт: {listing.hasElevator ? "есть" : "нет"}</span>
                  <span>
                    💡 ЖКХ:{" "}
                    {listing.utilitiesIncluded ? "включено" : "отдельно"}
                  </span>
                  <span>
                    🔐 Залог: {listing.depositAmount.toLocaleString("ru-RU")} ₽
                  </span>
                </div>
              </div>

              <div className="listing-owner-card">
                <span className="listing-muted">Владелец</span>

                <div className="listing-owner-row">
                  <ProtectedAvatar
                    avatarUrl={owner?.avatarUrl}
                    fallback={owner?.name?.[0] ?? "П"}
                    className="listing-owner-avatar"
                    imgClassName="listing-owner-avatar-img"
                  />
                  <div>
                    <Link
                      to={`/users/${listing.ownerId}`}
                      className="listing-owner-link"
                    >
                      {ownerName}
                    </Link>
                    <span>Владелец объявления</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="listing-side-card">
            <span className="listing-muted">Адрес</span>
            <h2>
              {listing.street}, {listing.houseNumber}
              {listing.districtName ? ` — ${listing.districtName}` : ""}
            </h2>

            <p>
              {listing.cityName}. Современная квартира в удобной локации рядом с
              основными точками интереса.
            </p>

            <div className="listing-rules">
              <span className="listing-muted">Правила проживания</span>

              {listing.livingRules.length > 0 ? (
                listing.livingRules.map((rule) => (
                  <div key={rule} className="listing-rule-pill">
                    {rule}
                  </div>
                ))
              ) : (
                <div className="listing-rule-pill">Правила не указаны</div>
              )}
            </div>

            <div className="listing-payment">
              <span className="listing-muted">Оплата</span>

              <div>
                <span>Коммунальные услуги</span>
                <b>{listing.utilitiesIncluded ? "Включены" : "Не включены"}</b>
              </div>

              <div>
                <span>Залог</span>
                <b>{listing.depositAmount.toLocaleString("ru-RU")} ₽</b>
              </div>

              <div>
                <span>Статус</span>
                <b
                  className={
                    listing.status === "ACTIVE"
                      ? "status-active"
                      : "status-rented"
                  }
                >
                  {listing.status === "ACTIVE" ? "Активно" : "Сдано"}
                </b>
              </div>
            </div>
          </aside>
        </section>

        <section className="listing-description-row">
          <section className="listing-description-card">
            <div className="listing-description-header">
              <div>
                <h1>{listing.title}</h1>

                <div className="listing-author-line">
                  <ProtectedAvatar
                    avatarUrl={owner?.avatarUrl}
                    fallback={owner?.name?.[0] ?? "П"}
                    className="listing-owner-avatar listing-owner-avatar--sm"
                    imgClassName="listing-owner-avatar-img"
                  />
                  <Link
                    to={`/users/${listing.ownerId}`}
                    className="listing-owner-link"
                  >
                    {ownerName}
                  </Link>
                  <b>
                    <AverageRating reviews={ownerReviews} compact />
                  </b>
                </div>
              </div>

              <span className="listing-muted">
                Опубликовано:{" "}
                {new Date(listing.createdAt).toLocaleDateString("ru-RU")}
              </span>
            </div>

            <p>{listing.description}</p>

            <h3>Правила проживания</h3>

            <div className="listing-amenities">
              {listing.livingRules.length > 0 ? (
                listing.livingRules.map((rule) => (
                  <div key={rule}>✓ {rule}</div>
                ))
              ) : (
                <div>Правила не указаны</div>
              )}
            </div>
          </section>

          <aside className="listing-booking-card">
            <span className="listing-muted">Заявка на аренду</span>
            <strong>{listing.price.toLocaleString("ru-RU")} ₽ / месяц</strong>

            <div className="listing-booking-image" />

            {!isOwnListing && (
              <>
                {listing.status === "ACTIVE" && (
                  <button
                    type="button"
                    className="listing-primary-button"
                    onClick={handleCreateApplication}
                    disabled={creatingApplication}
                  >
                    Подать заявку
                  </button>
                )}

                <button
                  type="button"
                  className="listing-secondary-button"
                  onClick={handleOpenConversation}
                >
                  Написать владельцу
                </button>
              </>
            )}
          </aside>
        </section>

        <section className="listing-location-card">
          <div className="listing-location-header">
            <div>
              <span className="listing-muted">Расположение</span>
              <h2>Квартира на карте — рядом точки интереса</h2>
              <p>
                Ниже показана карта с объектом и отмеченными школами,
                остановками и магазинами в пешей доступности.
              </p>
            </div>

            <span className="listing-muted">Радиус 10 минут пешком</span>
          </div>

          <div className="listing-location-content">
            <ListingMap
              latitude={listing.latitude}
              longitude={listing.longitude}
              title={listing.title}
              address={listingAddress}
              nearbyPlaces={mapNearbyPlaces}
              onMapView={() => {
                if (mapViewTracked) return;

                setMapViewTracked(true);
                trackListingEvent(listing.id, "VIEW_MAP").catch(() => {});
              }}
            />

            <aside className="listing-map-legend">
              <h3>Рядом</h3>

              {nearbyLoading && <p>Загрузка мест рядом...</p>}

              {!nearbyLoading && previewNearbyGroups.length > 0 && (
                <>
                  <div className="listing-nearby-preview-list">
                    {previewNearbyGroups.map((group) => (
                      <NearbyGroup key={group.key} group={group} />
                    ))}
                  </div>

                  {allNearbyGroups.length > 0 && (
                    <button
                      type="button"
                      className="listing-nearby-show-all"
                      onClick={() => {
                        trackListingEvent(listing.id, "VIEW_NEARBY").catch(
                          () => {},
                        );
                        setIsNearbyModalOpen(true);
                      }}
                    >
                      Смотреть все места рядом
                    </button>
                  )}
                </>
              )}

              {!nearbyLoading &&
                nearbyPlaces &&
                allNearbyGroups.length === 0 && (
                  <p>Поблизости не найдено популярных мест.</p>
                )}

              {!nearbyLoading && !nearbyPlaces && (
                <p>Не удалось загрузить места рядом.</p>
              )}
            </aside>
          </div>
        </section>

        <section className="listing-reviews-section">
          <div className="listing-reviews-header">
            <h2>Отзывы</h2>
            {!isOwnListing && (
              <button
                type="button"
                onClick={() => {
                  if (!requireAuth()) return;
                  setIsReviewModalOpen(true);
                }}
              >
                {myListingReview ? "Редактировать отзыв" : "Оставить отзыв"}
              </button>
            )}
          </div>

          <div className="listing-reviews-content">
            {reviewsLoading ? (
              <p className="listing-reviews-empty">Загрузка отзывов...</p>
            ) : reviews.length > 0 ? (
              <ReviewCarousel reviews={reviews} />
            ) : (
              <p className="listing-reviews-empty">Пока нет отзывов</p>
            )}
          </div>
        </section>
        {!isOwnListing && (
          <ReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            targetType="LISTING"
            targetId={listing.id}
            title={listing.title}
            subtitle={
              owner
                ? `${owner.name} ${owner.surname}`
                : `Владелец #${listing.ownerId}`
            }
            avatarUrl={photos[0]?.url}
            fallback={listing.title[0]}
            reviews={reviews}
            reviewToEdit={myListingReview}
            onSuccess={reloadListingReviews}
          />
        )}

        {isOwnListing && (
          <CreateListingModal
            isOpen={isEditListingModalOpen}
            listingToEdit={listing}
            onClose={() => setIsEditListingModalOpen(false)}
            onSuccess={reloadListingDetails}
            onDelete={() => navigate("/listings")}
          />
        )}
        {isNearbyModalOpen && (
          <NearbyPlacesModal
            groups={allNearbyGroups}
            onClose={() => setIsNearbyModalOpen(false)}
          />
        )}
      </div>
    </main>
  );
}
