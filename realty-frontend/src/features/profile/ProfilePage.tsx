import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { getMyProfile, type UserProfile } from "../../api/userApi";
import { getMyListings, type Listing } from "../../api/listingApi";
import { getListingPhotos, type ListingPhoto } from "../../api/listingPhotoApi";
import { getReviewsByTarget, type ReviewResponse } from "../../api/reviewApi";
import { CreateListingModal } from "../listings/CreateListingModal";
import { ProtectedImage } from "../../components/ProtectedImage";
import { AverageRating } from "../../components/reviews/AverageRating";
import { ProfileSidebar } from "./ProfileSidebar";
import { ProfileApplicationsSection } from "./ProfileApplicationsSection";
import { ProfileReviewsSection } from "./ProfileReviewsSection";
import { ProfileSettingsSection } from "./ProfileSettingsSection";
import "./ProfilePage.css";

type ProfileTab =
  | "listings"
  | "applications"
  | "chats"
  | "reviews"
  | "settings";

type ListingStatusFilter =
  | "ALL"
  | "ACTIVE"
  | "RENTED"
  | "ON_MODERATION"
  | "REJECTED";

function getListingStatusLabel(status: Listing["status"]) {
  switch (status) {
    case "ACTIVE":
      return "Активно";
    case "RENTED":
      return "Сдано";
    case "ON_MODERATION":
      return "На модерации";
    case "REJECTED":
      return "Отклонено";
    case "DELETED":
      return "Удалено";
    default:
      return status;
  }
}

function getListingStatusClass(status: Listing["status"]) {
  switch (status) {
    case "ACTIVE":
      return "profile-status-active";
    case "RENTED":
      return "profile-status-rented";
    case "ON_MODERATION":
      return "profile-status-moderation";
    case "REJECTED":
      return "profile-status-rejected";
    default:
      return "profile-status-default";
  }
}

export function ProfilePage() {
  const token = sessionStorage.getItem("token");

  const [activeTab, setActiveTab] = useState<ProfileTab>("listings");

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);

  const [listingPhotos, setListingPhotos] = useState<
    Record<number, ListingPhoto | null>
  >({});

  const [listingReviews, setListingReviews] = useState<
    Record<number, ReviewResponse[]>
  >({});

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ListingStatusFilter>("ALL");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [listingToEdit, setListingToEdit] = useState<Listing | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadListings() {
    const data = await getMyListings();
    setListings(data);

    const photoEntries = await Promise.all(
      data.map(async (listing) => {
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

    const reviewEntries = await Promise.all(
      data.map(async (listing) => {
        try {
          const reviews = await getReviewsByTarget("LISTING", listing.id);
          return [listing.id, reviews] as const;
        } catch {
          return [listing.id, []] as const;
        }
      }),
    );

    setListingPhotos(Object.fromEntries(photoEntries));
    setListingReviews(Object.fromEntries(reviewEntries));
  }

  async function loadProfilePage() {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const [profileData] = await Promise.all([getMyProfile(), loadListings()]);

      setProfile(profileData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки профиля");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfilePage();
  }, [token]);

  const filteredListings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return listings.filter((listing) => {
      const matchesSearch =
        !query ||
        listing.title.toLowerCase().includes(query) ||
        `${listing.cityName} ${listing.street} ${listing.houseNumber}`
          .toLowerCase()
          .includes(query) ||
        String(listing.id).includes(query);

      const matchesStatus =
        statusFilter === "ALL" || listing.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [listings, searchQuery, statusFilter]);

  const activeCount = listings.filter((l) => l.status === "ACTIVE").length;
  const rentedCount = listings.filter((l) => l.status === "RENTED").length;
  const moderationCount = listings.filter(
    (l) => l.status === "ON_MODERATION",
  ).length;

  const rejectedCount = listings.filter((l) => l.status === "REJECTED").length;

  if (!token) {
    return <p className="profile-page-message">Вы не авторизованы</p>;
  }

  if (loading) {
    return <p className="profile-page-message">Загрузка...</p>;
  }

  if (error) {
    return (
      <p className="profile-page-message profile-page-message--error">
        {error}
      </p>
    );
  }

  return (
    <main className="page profile-page">
      <div className="page-container profile-page-container">
        <ProfileSidebar
          profile={profile}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <section className="profile-content">
          {activeTab === "listings" && (
            <>
              <div className="profile-toolbar">
                <input
                  className="profile-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по заголовку, адресу или ID"
                />

                <div className="profile-status-dropdown">
                  <button
                    type="button"
                    className="profile-status-toggle"
                    onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
                  >
                    {statusFilter === "ALL"
                      ? "Все статусы"
                      : getListingStatusLabel(statusFilter)}
                    <span>▾</span>
                  </button>

                  <div
                    className={`profile-status-menu ${
                      isStatusDropdownOpen ? "profile-status-menu--open" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("ALL");
                        setIsStatusDropdownOpen(false);
                      }}
                    >
                      Все статусы
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("ACTIVE");
                        setIsStatusDropdownOpen(false);
                      }}
                    >
                      Активные
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("RENTED");
                        setIsStatusDropdownOpen(false);
                      }}
                    >
                      Сданные
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("ON_MODERATION");
                        setIsStatusDropdownOpen(false);
                      }}
                    >
                      На модерации
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("REJECTED");
                        setIsStatusDropdownOpen(false);
                      }}
                    >
                      Отклоненные
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="profile-create-button"
                  onClick={() => {
                    setListingToEdit(null);
                    setIsListingModalOpen(true);
                  }}
                >
                  + Создать объявление
                </button>

                <div className="profile-stats">
                  <div>
                    <span>Всего объявлений:</span>
                    <b>{listings.length}</b>
                  </div>

                  <div>
                    <span>Активных:</span>
                    <b className="profile-stat-active">{activeCount}</b>
                  </div>

                  <div>
                    <span>Сдано:</span>
                    <b className="profile-stat-rented">{rentedCount}</b>
                  </div>
                  <div>
                    <span>На модерации:</span>
                    <b className="profile-stat-moderation">{moderationCount}</b>
                  </div>

                  <div>
                    <span>Отклонено:</span>
                    <b className="profile-stat-rejected">{rejectedCount}</b>
                  </div>
                </div>
              </div>

              {filteredListings.length > 0 ? (
                <div className="profile-listings-grid">
                  {filteredListings.map((listing) => (
                    <Link
                      key={listing.id}
                      to={`/listings/${listing.id}`}
                      className="profile-listing-card-link"
                    >
                      <article className="profile-listing-card">
                        <ProtectedImage
                          src={listingPhotos[listing.id]?.url}
                          alt={listing.title}
                          className="profile-listing-image"
                          placeholderClassName="profile-listing-image"
                        />

                        <div className="profile-listing-body">
                          <div className="profile-listing-header">
                            <h3>{listing.title}</h3>
                            <span>ID {listing.id}</span>
                          </div>

                          <p className="profile-listing-address">
                            {listing.districtName
                              ? `${listing.districtName}, `
                              : ""}
                            {listing.cityName}
                          </p>

                          <strong>
                            {listing.price.toLocaleString("ru-RU")} ₽ / мес
                          </strong>

                          <p className="profile-listing-description">
                            {listing.description}
                          </p>

                          <div className="profile-listing-footer">
                            <span
                              className={getListingStatusClass(listing.status)}
                            >
                              {getListingStatusLabel(listing.status)}
                            </span>

                            <span className="profile-listing-rating">
                              <AverageRating
                                reviews={listingReviews[listing.id] ?? []}
                                compact
                              />
                            </span>
                          </div>
                          {listing.status === "REJECTED" &&
                            listing.rejectionReason && (
                              <div className="profile-rejection-reason">
                                <span>Причина отклонения</span>
                                <p>{listing.rejectionReason}</p>
                              </div>
                            )}

                          <div className="profile-listing-actions">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                setListingToEdit(listing);
                                setIsListingModalOpen(true);
                              }}
                            >
                              Редактировать
                            </button>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="profile-empty">Объявления не найдены</p>
              )}
            </>
          )}

          {activeTab === "applications" && <ProfileApplicationsSection />}

          {activeTab === "reviews" && <ProfileReviewsSection />}

          {activeTab === "settings" && profile && (
            <ProfileSettingsSection
              profile={profile}
              onProfileUpdate={setProfile}
            />
          )}
        </section>

        <CreateListingModal
          isOpen={isListingModalOpen}
          listingToEdit={listingToEdit}
          onClose={() => {
            setIsListingModalOpen(false);
            setListingToEdit(null);
          }}
          onSuccess={async () => {
            await loadListings();
            setListingToEdit(null);
          }}
          onDelete={async () => {
            await loadListings();
            setListingToEdit(null);
          }}
        />
      </div>
    </main>
  );
}
