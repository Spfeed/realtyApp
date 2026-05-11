import { request } from "./http";

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type RentalApplication = {
  id: number;
  userId: number;
  listingId: number;
  status: ApplicationStatus;
  conversationId?: number;
  createdAt: string;
  updatedAt?: string;
};

export async function createApplication(listingId: number) {
  return request<RentalApplication>("/api/applications", {
    method: "POST",
    body: JSON.stringify({ listingId }),
  });

}

export async function getMyApplications() {
  return request<RentalApplication[]>("/api/applications/my");
}

export async function getApplicationsByListingId(listingId: number) {
  return request<RentalApplication[]>(`/api/applications/listing/${listingId}`);
}

export async function approveApplication(id: number) {
  return request<RentalApplication>(`/api/applications/${id}/approve`, {
    method: "PATCH",
  });
}

export async function rejectApplication(id: number) {
  return request<RentalApplication>(`/api/applications/${id}/reject`, {
    method: "PATCH",
  });
}

export async function getMyApplicationByListingId(listingId: number) {
  return request<RentalApplication | null>(
    `/api/applications/my/listings/${listingId}`
  );
}

export async function cancelApplication(id: number) {
  return request<void>(`/api/applications/${id}`, {
    method: "DELETE",
  });
}