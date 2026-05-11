import { request } from "./http";

export type ListingStatus =
  | "ON_MODERATION"
  | "ACTIVE"
  | "RENTED"
  | "REJECTED"
  | "DELETED";

export type Listing = {
  id: number;
  title: string;
  description: string;
  area: number; // BigDecimal → number
  price: number;
  utilitiesIncluded: boolean;
  depositAmount: number;
  floor?: number | null;
  hasElevator: boolean;
  ownerId: number;

  cityId: number;
  cityName: string;

  districtId?: number;
  districtName?: string;

  street: string;
  houseNumber: string;

  livingRules: string[];

  createdAt: string;
  updatedAt?: string;

  status: ListingStatus;
  rejectionReason?: string;

  latitude?: number | null;
  longitude?: number | null;
};

export type CreateListingRequest = {
  title: string;
  description?: string;
  area: number;
  price: number;
  utilitiesIncluded: boolean;
  depositAmount: number;
  floor?: number | null;
  hasElevator: boolean;
  cityId: number;
  districtId?: number;
  street: string;
  houseNumber: string;
  livingRuleIds: number[];
};

export type ListingFilter = {
  cityId?: number;
  districtId?: number;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  utilitiesIncluded?: boolean;
  maxDepositAmount?: number;
  minFloor?: number;
  maxFloor?: number;
  hasElevator?: boolean;
};

export type UpdateListingRequest = CreateListingRequest;

export type NearbyPlace = {
  name: string;
  category: string;
  osmType: string;
  osmId: number;
  latitude: number;
  longitude: number;
  distanceMeters: number;
};

export type NearbyPlacesResponse = {
  schools: NearbyPlace[];
  kindergartens: NearbyPlace[];
  universities: NearbyPlace[];
  hospitals: NearbyPlace[];
  pharmacies: NearbyPlace[];
  shops: NearbyPlace[];
  transport: NearbyPlace[];
  parks: NearbyPlace[];
  food: NearbyPlace[];
};

export async function getListings() {
  return request<Listing[]>("/api/listings");
}

export async function getListingById(id: number) {
  return request<Listing>(`/api/listings/${id}`);
}

export async function getMyListings() {
  return request<Listing[]>("/api/listings/my");
}

export async function createListing(data: CreateListingRequest) {
  return request<Listing>("/api/listings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function filterListings(filter: ListingFilter) {
  const params = new URLSearchParams();

  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, String(value));
    }
  });

  const query = params.toString();

  return request<Listing[]>(
    query ? `/api/listings/filter?${query}` : "/api/listings",
  );
}

export async function getListingsByOwner(ownerId: number) {
  const listings = await getListings();
  return listings.filter((listing) => listing.ownerId === ownerId);
}

export async function updateListing(id: number, data: UpdateListingRequest) {
  return request<Listing>(`/api/listings/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteListing(id: number) {
  return request<void>(`/api/listings/${id}`, {
    method: "DELETE",
  });
}

export async function getListingsForModeration() {
  return request<Listing[]>("/api/listings/admin/moderation");
}

export async function approveListing(id: number) {
  return request<Listing>(`/api/listings/admin/moderation/${id}/approve`, {
    method: "PATCH",
  });
}

export async function rejectListing(id: number, reason: string) {
  return request<Listing>(`/api/listings/admin/moderation/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export async function getNearbyPlaces(listingId: number) {
  return request<NearbyPlacesResponse>(`/api/listings/${listingId}/nearby`);
}
