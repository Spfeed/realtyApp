import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  getMyApplications,
  cancelApplication,
  type ApplicationStatus,
  type RentalApplication,
} from "../../api/applicationApi";
import { getListingById, type Listing } from "../../api/listingApi";
import { getListingPhotos, type ListingPhoto } from "../../api/listingPhotoApi";
import { ProtectedImage } from "../../components/ProtectedImage";

type StatusFilter = "ALL" | ApplicationStatus;

const statusLabels: Record<ApplicationStatus, string> = {
  PENDING: "В обработке",
  APPROVED: "Принята",
  REJECTED: "Отклонена",
};

export function ProfileApplicationsSection() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState<RentalApplication[]>([]);
  const [listings, setListings] = useState<Record<number, Listing>>({});
  const [photos, setPhotos] = useState<Record<number, ListingPhoto | null>>({});

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadApplications() {
    try {
      setLoading(true);
      setError("");

      const applicationData = await getMyApplications();
      setApplications(applicationData);

      const listingEntries = await Promise.all(
        applicationData.map(async (application) => {
          try {
            const listing = await getListingById(application.listingId);
            return [application.listingId, listing] as const;
          } catch {
            return [application.listingId, null] as const;
          }
        }),
      );

      const validListings = Object.fromEntries(
        listingEntries.filter((entry): entry is readonly [number, Listing] =>
          Boolean(entry[1]),
        ),
      );

      setListings(validListings);

      const photoEntries = await Promise.all(
        Object.values(validListings).map(async (listing) => {
          try {
            const listingPhotos = await getListingPhotos(listing.id);

            const mainPhoto =
              listingPhotos.find((photo) => photo.isMain) ??
              listingPhotos.sort((a, b) => a.sortOrder - b.sortOrder)[0] ??
              null;

            return [listing.id, mainPhoto] as const;
          } catch {
            return [listing.id, null] as const;
          }
        }),
      );

      setPhotos(Object.fromEntries(photoEntries));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки заявок");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelApplication(id: number) {
    try {
      await cancelApplication(id);

      setApplications((prev) =>
        prev.filter((application) => application.id !== id),
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка отмены заявки");
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  const filteredApplications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return applications.filter((application) => {
      const listing = listings[application.listingId];

      const matchesStatus =
        statusFilter === "ALL" || application.status === statusFilter;

      const matchesSearch =
        !query ||
        String(application.id).includes(query) ||
        String(application.listingId).includes(query) ||
        listing?.title.toLowerCase().includes(query) ||
        listing?.cityName.toLowerCase().includes(query) ||
        listing?.street.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [applications, listings, statusFilter, searchQuery]);

  if (loading) {
    return <p className="profile-empty">Загрузка заявок...</p>;
  }

  if (error) {
    return <p className="profile-empty profile-empty--error">{error}</p>;
  }

  return (
    <section className="profile-applications-section">
      <div className="profile-toolbar">
        <input
          className="profile-search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по объявлению, городу или ID заявки"
        />

        <select
          className="profile-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="ALL">Все заявки</option>
          <option value="PENDING">В обработке</option>
          <option value="APPROVED">Принятые</option>
          <option value="REJECTED">Отклонённые</option>
        </select>
      </div>

      {filteredApplications.length > 0 ? (
        <div className="profile-applications-grid">
          {filteredApplications.map((application) => {
            const listing = listings[application.listingId];
            const photo = photos[application.listingId];

            return (
              <article
                key={application.id}
                className="profile-application-card"
              >
                <Link
                  to={`/listings/${application.listingId}`}
                  className="profile-application-main"
                >
                  <ProtectedImage
                    src={photo?.url}
                    alt={listing?.title ?? "Объявление"}
                    className="profile-application-image"
                    placeholderClassName="profile-application-image"
                  />

                  <div className="profile-application-body">
                    <div className="profile-application-header">
                      <h3>
                        {listing?.title ??
                          `Объявление #${application.listingId}`}
                      </h3>

                      <span
                        className={`profile-application-status profile-application-status--${application.status.toLowerCase()}`}
                      >
                        {statusLabels[application.status]}
                      </span>
                    </div>

                    <p>
                      {listing
                        ? `${listing.cityName}, ${listing.street} ${listing.houseNumber}`
                        : "Данные объявления недоступны"}
                    </p>

                    {listing && (
                      <strong>
                        {listing.price.toLocaleString("ru-RU")} ₽ / мес
                      </strong>
                    )}

                    <small>
                      Заявка #{application.id} ·{" "}
                      {new Date(application.createdAt).toLocaleDateString(
                        "ru-RU",
                      )}
                    </small>
                  </div>
                </Link>

                <div className="profile-application-actions">
                  {application.status === "PENDING" && (
                    <button
                      type="button"
                      className="profile-application-cancel"
                      onClick={() => handleCancelApplication(application.id)}
                    >
                      Отменить заявку
                    </button>
                  )}
                  {application.conversationId && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/chats/${application.conversationId}`)
                      }
                    >
                      Открыть чат
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="profile-empty">Заявки не найдены</p>
      )}
    </section>
  );
}
