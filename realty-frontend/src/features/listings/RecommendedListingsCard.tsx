import { useState } from "react";
import { Link } from "react-router";
import type { Listing } from "../../api/listingApi";
import type { ListingPhoto } from "../../api/listingPhotoApi";
import { ProtectedImage } from "../../components/ProtectedImage";

type Props = {
  listings: Listing[];
  photos: Record<number, ListingPhoto | null>;
};

export function RecommendedListingsCard({ listings, photos }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const previewListings = listings.slice(0, 3);

  return (
    <>
      <section className="recommended-card">
        <div className="recommended-header">
          <h2>Рекомендованные</h2>

          <button
            type="button"
            className="recommended-show-all"
            onClick={() => setIsModalOpen(true)}
            disabled={listings.length === 0}
          >
            Подборка для вас
          </button>
        </div>

        <div className="recommended-list">
          {previewListings.length > 0 ? (
            previewListings.map((listing) => (
              <RecommendedItem
                key={listing.id}
                listing={listing}
                photo={photos[listing.id]}
              />
            ))
          ) : (
            <p className="recommended-empty">Пока нет рекомендаций</p>
          )}
        </div>
      </section>

      {isModalOpen && (
        <div
          className="recommended-modal-backdrop"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="recommended-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="recommended-modal-header">
              <div>
                <span>Рекомендации</span>
                <h3>Подборка для вас</h3>
              </div>

              <button type="button" onClick={() => setIsModalOpen(false)}>
                ×
              </button>
            </div>

            <div className="recommended-modal-list">
              {listings.map((listing) => (
                <RecommendedItem
                  key={listing.id}
                  listing={listing}
                  photo={photos[listing.id]}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function RecommendedItem({
  listing,
  photo,
}: {
  listing: Listing;
  photo?: ListingPhoto | null;
}) {
  return (
    <Link to={`/listings/${listing.id}`} className="recommended-item">
      <ProtectedImage
        src={photo?.url}
        alt={listing.title}
        className="recommended-image"
        placeholderClassName="recommended-image"
      />

      <div>
        <h3>{listing.title}</h3>
        <p>
          {listing.area} м² · {listing.cityName}
        </p>
      </div>

      <strong>{listing.price.toLocaleString("ru-RU")} ₽</strong>
    </Link>
  );
}