import { useEffect, useState } from "react";
import {
  getAdminUsers,
  updateUserRole,
  type AdminUser,
} from "../../api/adminApi";
import type { UserRole } from "../../api/authApi";
import "./AdminUsersPage.css";
import { getCurrentUserId } from "../../api/authApi";

const roles: UserRole[] = ["USER", "MODERATOR", "ADMIN"];

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const currentUserId = getCurrentUserId();

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ошибка загрузки пользователей",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: number, role: UserRole) {
    try {
      setUpdatingUserId(userId);
      const updated = await updateUserRole(userId, role);

      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? updated : user)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка изменения роли");
    } finally {
      setUpdatingUserId(null);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <main className="admin-users-page">
      <div className="admin-users-header">
        <div>
          <p>Администрирование</p>
          <h1>Пользователи и роли</h1>
        </div>

        <button type="button" onClick={loadUsers}>
          Обновить
        </button>
      </div>

      {error && <div className="admin-users-error">{error}</div>}

      {loading ? (
        <div className="admin-users-state">Загрузка пользователей...</div>
      ) : (
        <div className="admin-users-table-wrapper">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Создан</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => {
                const isCurrentUser = user.id === currentUserId;

                return (
                  <tr key={user.id}>
                    <td>#{user.id}</td>
                    <td>
                      {user.email}
                      {isCurrentUser && (
                        <span className="admin-users-current-badge">Вы</span>
                      )}
                    </td>
                    <td>
                      <select
                        value={user.role}
                        disabled={isCurrentUser || updatingUserId === user.id}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value as UserRole)
                        }
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
