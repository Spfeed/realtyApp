import { request } from "./http";

export type CreateUserProfileRequest = {
  surname: string;
  name: string;
  patronymic?: string;
  phone: string;
};

export type UserProfile = {
  id: number;
  authUserId: number;
  surname: string;
  name: string;
  patronymic?: string;
  phone: string;
  avatarUrl?: string | null;
};

export type UpdateUserProfileRequest = {
  surname: string;
  name: string;
  patronymic?: string;
  phone: string;
};

export async function createProfile(data: CreateUserProfileRequest) {
  return request<UserProfile>("/api/users/profile", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMyProfile() {
  return request<UserProfile>("/api/users/profile/me");
}

export async function getUserById(id: number) {
  return request<UserProfile>(`/api/users/profile/${id}`);
}

export async function updateMyProfile(data: UpdateUserProfileRequest) {
  return request<UserProfile>("/api/users/profile/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return request<UserProfile>("/api/users/profile/avatar", {
    method: "POST",
    body: formData,
  });
}

export async function deleteAvatar() {
  return request<UserProfile>("/api/users/profile/avatar", {
    method: "DELETE",
  });
}