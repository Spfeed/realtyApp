import { request } from "./http";

export type ReviewTargetType = "LISTING" | "LANDLORD";

export type ReviewResponse = {
  id: number;
  authorId: number;
  targetType: ReviewTargetType;
  targetId: number;
  rating: number;
  text: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type CreateReviewRequest = {
  targetType: ReviewTargetType;
  targetId: number;
  rating: number;
  text?: string;
};

export type UpdateReviewRequest = {
  rating: number;
  text?: string;
};

export function getReviewsByTarget(targetType: ReviewTargetType, targetId: number) {
  return request<ReviewResponse[]>(
    `/api/reviews?targetType=${targetType}&targetId=${targetId}`
  );
}

export function getMyReviews() {
  return request<ReviewResponse[]>("/api/reviews/my");
}

export function createReview(data: CreateReviewRequest) {
  return request<ReviewResponse>("/api/reviews", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateReview(reviewId: number, data: UpdateReviewRequest) {
  return request<ReviewResponse>(`/api/reviews/${reviewId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteReview(reviewId: number) {
  return request<void>(`/api/reviews/${reviewId}`, {
    method: "DELETE",
  });
}