import { Link } from "react-router";
import type { Listing } from "../../api/listingApi";
import type { ListingPhoto } from "../../api/listingPhotoApi";
import type { ReviewResponse } from "../../api/reviewApi";
import { ProtectedImage } from "../../components/ProtectedImage";
import { AverageRating } from "../../components/reviews/AverageRating";

type Props = {
  listing: Listing;
  photo?: ListingPhoto | null;
  reviews?: ReviewResponse[];
  canManage?: boolean;
  onEdit?: () => void;
  onHide?: () => void;
};

export function ListingCard({
  listing,
  photo,
  reviews = [],
  canManage = false,
  onEdit,
  onHide,
}: Props) {
  return (
    <article className="listing-card">
      {canManage && (
        <button
          type="button"
          className="listing-card-edit-button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit?.();
          }}
        >
          Редактировать
        </button>
      )}

      <Link to={`/listings/${listing.id}`} className="listing-card-link">
        <ProtectedImage
          src={photo?.url}
          alt={listing.title}
          className="listing-card-image"
          placeholderClassName="listing-card-image"
        />

        <div className="listing-card-content">
          <div className="listing-card-top">
            <h2>{listing.title}</h2>
            <strong>{listing.price.toLocaleString("ru-RU")} ₽</strong>
          </div>

          <p className="listing-card-location">
            {listing.districtName ? `${listing.districtName} · ` : ""}
            {listing.cityName}
          </p>

          <p className="listing-card-description">{listing.description}</p>

          <div className="listing-card-tags">
            <span>{listing.area} м²</span>
            {listing.floor != null && <span>{listing.floor} этаж</span>}
            <span>{listing.hasElevator ? "Лифт есть" : "Без лифта"}</span>
            <span>
              {listing.utilitiesIncluded ? "ЖКХ включены" : "ЖКХ отдельно"}
            </span>
            <span>{listing.depositAmount.toLocaleString("ru-RU")} ₽ залог</span>
          </div>

          <p className="listing-card-rating">
            <AverageRating reviews={reviews} />
          </p>
        </div>
      </Link>
      {!canManage && onHide && (
        <button
          type="button"
          className="listing-card-hide-button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onHide();
          }}
        >
          Не интересно
        </button>
      )}
    </article>
  );
}
