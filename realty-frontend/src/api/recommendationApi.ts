import { request } from "./http";

export type UserListingEventType =
  | "VIEW"
  | "VIEW_PHOTOS"
  | "VIEW_MAP"
  | "VIEW_NEARBY"
  | "CONTACT_OWNER"
  | "APPLICATION"
  | "REVIEW"
  | "HIDE";

export type RecommendationResponse = {
  listingId: number;
  score: number;
};


export async function trackListingEvent(
  listingId: number,
  eventType: UserListingEventType,
) {
  return request<void>("/api/recommendations/events", {
    method: "POST",
    body: JSON.stringify({ listingId, eventType }),
  });
}

export async function getMyRecommendations(limit = 10) {
  return request<RecommendationResponse[]>(
    `/api/recommendations/me?limit=${limit}`,
  );
}