import { useEffect, useMemo, useState } from "react";
import {
  filterListings,
  getListingById,
  getListings,
  type Listing,
  type ListingFilter,
} from "../../api/listingApi";
import {
  getCities,
  getDistricts,
  type City,
  type District,
} from "../../api/referenceApi";
import { getListingPhotos, type ListingPhoto } from "../../api/listingPhotoApi";
import { ListingCard } from "./ListingCard";
import { ListingsFilterDropdown } from "./ListingsFilterDropdown";
import { RecommendedListingsCard } from "./RecommendedListingsCard";
import { ListingsMapCard } from "./ListingsMapCard";
import { ListingsPagination } from "./ListingsPagination";
import "./ListingsPage.css";
import { getReviewsByTarget, type ReviewResponse } from "../../api/reviewApi";
import { CreateListingModal } from "./CreateListingModal";
import { getCurrentUserId, isAuthenticated } from "../../api/authApi";
import {
  getMyRecommendations,
  trackListingEvent,
} from "../../api/recommendationApi";

import { useNavigate } from "react-router";

const ITEMS_PER_PAGE = 8;

export type ListingsFilterState = {
  cityId: string;
  districtId: string;
  minPrice: string;
  maxPrice: string;
  minArea: string;
  maxArea: string;
  utilitiesIncluded: string;
  maxDepositAmount: string;
  minFloor: string;
  maxFloor: string;
  hasElevator: string;
};

const defaultFilter: ListingsFilterState = {
  cityId: "",
  districtId: "",
  minPrice: "",
  maxPrice: "",
  minArea: "",
  maxArea: "",
  utilitiesIncluded: "",
  maxDepositAmount: "",
  minFloor: "",
  maxFloor: "",
  hasElevator: "",
};

export function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  const [filter, setFilter] = useState<ListingsFilterState>(defaultFilter);
  const [searchQuery, setSearchQuery] = useState("");

  const [recommendedListings, setRecommendedListings] = useState<Listing[]>([]);

  const [listingReviews, setListingReviews] = useState<
    Record<number, ReviewResponse[]>
  >({});

  const [listingMainPhotos, setListingMainPhotos] = useState<
    Record<number, ListingPhoto | null>
  >({});

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [listingToEdit, setListingToEdit] = useState<Listing | null>(null);

  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");

  async function loadListings() {
    const data = await getListings();
    setListings(data);
    await Promise.all([loadMainPhotos(data), loadListingReviews(data)]);
  }

  async function loadListingReviews(data: Listing[]) {
    const entries = await Promise.all(
      data.map(async (listing) => {
        try {
          const reviews = await getReviewsByTarget("LISTING", listing.id);
          return [listing.id, reviews] as const;
        } catch {
          return [listing.id, []] as const;
        }
      }),
    );

    setListingReviews(Object.fromEntries(entries));
  }

  async function handleHideListing(listingId: number) {
    setListings((prev) => prev.filter((listing) => listing.id !== listingId));
    setRecommendedListings((prev) =>
      prev.filter((listing) => listing.id !== listingId),
    );

    try {
      await trackListingEvent(listingId, "HIDE");
    } catch {}
  }

  async function loadMainPhotos(data: Listing[]) {
    const entries = await Promise.all(
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

    setListingMainPhotos((prev) => ({
      ...prev,
      ...Object.fromEntries(entries),
    }));
  }

  useEffect(() => {
    loadListings().catch((e) => setError(e.message));
    if (isAuthenticated()) {
      loadRecommendations().catch(() => {});
    }

    getCities()
      .then(setCities)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!filter.cityId) {
      setDistricts([]);
      setFilter((prev) => ({ ...prev, districtId: "" }));
      return;
    }

    getDistricts(Number(filter.cityId))
      .then(setDistricts)
      .catch((e) => setError(e.message));
  }, [filter.cityId]);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    setCurrentPage(1);

    const payload: ListingFilter = {
      cityId: filter.cityId ? Number(filter.cityId) : undefined,
      districtId: filter.districtId ? Number(filter.districtId) : undefined,
      minPrice: filter.minPrice ? Number(filter.minPrice) : undefined,
      maxPrice: filter.maxPrice ? Number(filter.maxPrice) : undefined,
      minArea: filter.minArea ? Number(filter.minArea) : undefined,
      maxArea: filter.maxArea ? Number(filter.maxArea) : undefined,
      utilitiesIncluded:
        filter.utilitiesIncluded === ""
          ? undefined
          : filter.utilitiesIncluded === "true",
      maxDepositAmount: filter.maxDepositAmount
        ? Number(filter.maxDepositAmount)
        : undefined,
      minFloor: filter.minFloor ? Number(filter.minFloor) : undefined,
      maxFloor: filter.maxFloor ? Number(filter.maxFloor) : undefined,
      hasElevator:
        filter.hasElevator === "" ? undefined : filter.hasElevator === "true",
    };

    try {
      const data = await filterListings(payload);
      setListings(data);
      await Promise.all([loadMainPhotos(data), loadListingReviews(data)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка фильтрации");
    }
  }

  async function resetFilters() {
    setFilter(defaultFilter);
    setSearchQuery("");
    setCurrentPage(1);

    const data = await getListings();
    setListings(data);
    await Promise.all([loadMainPhotos(data), loadListingReviews(data)]);
  }

  async function loadRecommendations() {
    try {
      const recommendations = await getMyRecommendations(10);

      const recommended = await Promise.all(
        recommendations.map((rec) => getListingById(rec.listingId)),
      );

      setRecommendedListings(recommended);

      await loadMainPhotos(recommended);
    } catch {
      setRecommendedListings([]);
    }
  }

  const searchedListings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return listings;

    return listings.filter((listing) =>
      listing.title.toLowerCase().includes(query),
    );
  }, [listings, searchQuery]);

  const totalPages = Math.ceil(searchedListings.length / ITEMS_PER_PAGE);

  const visibleListings = searchedListings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const currentUserId = getCurrentUserId();

  return (
    <main className="page listings-page">
      <div className="page-container listings-page-container">
        <section className="listings-topbar">
          <input
            className="listings-search"
            placeholder="Название объявления"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />

          <ListingsFilterDropdown
            filter={filter}
            setFilter={setFilter}
            cities={cities}
            districts={districts}
            onSubmit={handleSearch}
            onReset={resetFilters}
          />
          <button
            type="button"
            className="listings-create-button"
            onClick={() => {
              if (!authenticated) {
                navigate("/login");
                return;
              }

              setListingToEdit(null);
              setIsCreateModalOpen(true);
            }}
          >
            Создать объявление
          </button>
        </section>

        {error && <p className="listings-error">{error}</p>}

        <section className="listings-layout">
          <section className="listings-main">
            <div className="listings-heading-row">
              <h1>Актуальные объявления</h1>
              <span>
                Показано {visibleListings.length} из {searchedListings.length}
              </span>
            </div>

            {visibleListings.length > 0 ? (
              <div className="listings-grid">
                {visibleListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    photo={listingMainPhotos[listing.id]}
                    reviews={listingReviews[listing.id] ?? []}
                    canManage={currentUserId === listing.ownerId}
                    onEdit={() => {
                      setListingToEdit(listing);
                      setIsCreateModalOpen(true);
                    }}
                    onHide={() => handleHideListing(listing.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="listings-empty">Объявления не найдены</p>
            )}

            {totalPages > 1 && (
              <ListingsPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </section>

          <aside className="listings-sidebar">
            <RecommendedListingsCard
              listings={recommendedListings}
              photos={listingMainPhotos}
            />

            <ListingsMapCard
              listings={searchedListings}
              photos={listingMainPhotos}
            />
          </aside>
        </section>
        <CreateListingModal
          isOpen={isCreateModalOpen}
          listingToEdit={listingToEdit}
          onClose={() => {
            setIsCreateModalOpen(false);
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
