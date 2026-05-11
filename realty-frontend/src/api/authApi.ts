import { request } from "./http";

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  token: string;
};

export type UserRole = "USER" | "ADMIN" | "MODERATOR";

export function getCurrentUserRole(): UserRole | null {
  const token = sessionStorage.getItem("token");

  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    return payload.role ?? null;
  } catch {
    return null;
  }
}

export function isAdmin() {
  return getCurrentUserRole() === "ADMIN";
}

export function isModerator() {
  return getCurrentUserRole() === "MODERATOR";
}

export function isAdminOrModerator() {
  const role = getCurrentUserRole();
  return role === "ADMIN" || role === "MODERATOR";
}

export async function login(data: LoginRequest) {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function register(data: RegisterRequest) {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getCurrentUserId() {
  const token = sessionStorage.getItem("token");

  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    return Number(payload.userId ?? payload.id ?? payload.sub);
  } catch {
    return null;
  }
}

export function withAuthImage(url?: string | null) {
  if (!url) return null;

  const token = sessionStorage.getItem("token");

  if (!token) return url;

  const separator = url.includes("?") ? "&" : "?";

  return `${url}${separator}token=${token}`;
}

export function isAuthenticated() {
  return Boolean(sessionStorage.getItem("token"));
}