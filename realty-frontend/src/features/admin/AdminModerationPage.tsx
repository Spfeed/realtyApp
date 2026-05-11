import { useEffect, useState } from "react";
import {
  approveListing,
  getListingsForModeration,
  rejectListing,
  type Listing,
} from "../../api/listingApi";
import "./AdminModerationPage.css";

export function AdminModerationPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  async function loadListings() {
    try {
      setLoading(true);
      setError("");

      const data = await getListingsForModeration();
      setListings(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ошибка загрузки объявлений",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: number) {
    try {
      setProcessingId(id);
      setError("");

      await approveListing(id);
      setListings((prev) => prev.filter((listing) => listing.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка одобрения");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id: number) {
    const reason = window.prompt("Укажите причину отклонения объявления");

    if (!reason?.trim()) return;

    try {
      setProcessingId(id);
      setError("");

      await rejectListing(id, reason.trim());
      setListings((prev) => prev.filter((listing) => listing.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка отклонения");
    } finally {
      setProcessingId(null);
    }
  }

  useEffect(() => {
    loadListings();
  }, []);

  return (
    <main className="admin-moderation-page">
      <div className="admin-moderation-header">
        <div>
          <p>Модерация</p>
          <h1>Объявления на проверке</h1>
        </div>

        <button type="button" onClick={loadListings} disabled={loading}>
          Обновить
        </button>
      </div>

      {error && <div className="admin-moderation-error">{error}</div>}

      {loading ? (
        <div className="admin-moderation-state">Загрузка объявлений...</div>
      ) : listings.length === 0 ? (
        <div className="admin-moderation-state">
          Сейчас нет объявлений на модерации.
        </div>
      ) : (
        <section className="admin-moderation-grid">
          {listings.map((listing) => (
            <article className="admin-moderation-card" key={listing.id}>
              <div className="admin-moderation-card-top">
                <span>#{listing.id}</span>
                <strong>{listing.status}</strong>
              </div>

              <h2>{listing.title}</h2>

              <p className="admin-moderation-description">
                {listing.description || "Описание не указано"}
              </p>

              <div className="admin-moderation-meta">
                <span>{listing.cityName}</span>
                {listing.districtName && <span>{listing.districtName}</span>}
                <span>
                  {listing.street}, {listing.houseNumber}
                </span>
              </div>

              <div className="admin-moderation-info">
                <div>
                  <span>Цена</span>
                  <strong>{listing.price.toLocaleString()} ₽</strong>
                </div>

                <div>
                  <span>Площадь</span>
                  <strong>{listing.area} м²</strong>
                </div>

                <div>
                  <span>Залог</span>
                  <strong>{listing.depositAmount.toLocaleString()} ₽</strong>
                </div>
              </div>

              {listing.livingRules.length > 0 && (
                <div className="admin-moderation-rules">
                  {listing.livingRules.map((rule) => (
                    <span key={rule}>{rule}</span>
                  ))}
                </div>
              )}

              <div className="admin-moderation-actions">
                <button
                  type="button"
                  onClick={() => handleApprove(listing.id)}
                  disabled={processingId === listing.id}
                >
                  Одобрить
                </button>

                <button
                  type="button"
                  className="admin-moderation-danger"
                  onClick={() => handleReject(listing.id)}
                  disabled={processingId === listing.id}
                >
                  Отклонить
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
