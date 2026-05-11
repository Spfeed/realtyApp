import { request } from "./http";

export type City = {
  id: number;
  name: string;
};

export type District = {
  id: number;
  cityId: number;
  name: string;
};

export type LivingRule = {
  id: number;
  name: string;
};

export type ReferenceNameRequest = {
  name: string;
};

export type DistrictRequest = {
  cityId: number;
  name: string;
};

export async function getCities() {
  return request<City[]>("/api/references/cities");
}

export async function getDistricts(cityId: number) {
  return request<District[]>(`/api/references/cities/${cityId}/districts`);
}

export async function getLivingRules() {
  return request<LivingRule[]>("/api/references/living-rules");
}

export async function createCity(data: ReferenceNameRequest) {
  return request<City>("/api/references/admin/cities", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCity(id: number, data: ReferenceNameRequest) {
  return request<City>(`/api/references/admin/cities/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCity(id: number) {
  return request<void>(`/api/references/admin/cities/${id}`, {
    method: "DELETE",
  });
}

export async function createDistrict(data: DistrictRequest) {
  return request<District>("/api/references/admin/districts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDistrict(id: number, data: DistrictRequest) {
  return request<District>(`/api/references/admin/districts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteDistrict(id: number) {
  return request<void>(`/api/references/admin/districts/${id}`, {
    method: "DELETE",
  });
}

export async function createLivingRule(data: ReferenceNameRequest) {
  return request<LivingRule>("/api/references/admin/living-rules", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateLivingRule(id: number, data: ReferenceNameRequest) {
  return request<LivingRule>(`/api/references/admin/living-rules/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteLivingRule(id: number) {
  return request<void>(`/api/references/admin/living-rules/${id}`, {
    method: "DELETE",
  });
}