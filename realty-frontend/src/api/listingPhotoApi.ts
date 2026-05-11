import { request } from "./http";

export type ListingPhoto = {
  id: number;
  listingId: number;
  url: string;
  sortOrder: number;
  isMain: boolean;
};

export function getListingPhotos(listingId: number) {
  return request<ListingPhoto[]>(`/api/listings/${listingId}/photos`);
}

export function uploadListingPhotos(listingId: number, files: File[]) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  return request<ListingPhoto[]>(`/api/listings/${listingId}/photos`, {
    method: "POST",
    body: formData,
  });
}

export function deleteListingPhoto(photoId: number) {
  return request<void>(`/api/listings/photos/${photoId}`, {
    method: "DELETE",
  });
}

export function setMainListingPhoto(photoId: number) {
  return request<ListingPhoto>(`/api/listings/photos/${photoId}/main`, {
    method: "PATCH",
  });
}