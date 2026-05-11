import { request } from "./http";
import type { UserRole } from "./authApi";

export type AdminUser = {
  id: number;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type UpdateUserRoleRequest = {
  role: UserRole;
};

export async function getAdminUsers() {
  return request<AdminUser[]>("/api/auth/admin/users");
}

export async function updateUserRole(userId: number, role: UserRole) {
  return request<AdminUser>(`/api/auth/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}