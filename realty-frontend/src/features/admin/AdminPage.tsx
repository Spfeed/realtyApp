import { getCurrentUserRole } from "../../api/authApi";
import "./AdminPage.css";
import { Link } from "react-router";

export function AdminPage() {
  const role = getCurrentUserRole();

  return (
    <main className="admin-page">
      <section className="admin-hero">
        <div>
          <p className="admin-kicker">Панель управления</p>
          <h1>Админ-панель StayVille</h1>
          <p>
            Здесь будет управление пользователями, ролями, справочниками,
            модерацией объявлений и обращениями в поддержку.
          </p>
        </div>

        <div className="admin-role-card">
          <span>Текущая роль</span>
          <strong>{role}</strong>
        </div>
      </section>

      <section className="admin-grid">
        {role === "ADMIN" && (
          <article className="admin-card">
            <h2>Пользователи и роли</h2>
            <p>Назначение модераторов и управление правами пользователей.</p>
            <Link to="/admin/users" className="admin-card-link">
              Открыть
            </Link>
          </article>
        )}

        {role === "ADMIN" && (
          <article className="admin-card">
            <h2>Справочники</h2>
            <p>Города, районы и правила проживания.</p>
            <Link to="/admin/references" className="admin-card-link">
              Открыть
            </Link>
          </article>
        )}

        <article className="admin-card">
          <h2>Модерация объявлений</h2>
          <p>Проверка, редактирование и удаление объявлений.</p>
          <Link to="/admin/moderation" className="admin-card-link">
            Открыть
          </Link>
        </article>

        <article className="admin-card">
          <h2>Поддержка</h2>
          <p>Диалоги пользователей со службой поддержки.</p>
          <Link to="/admin/support" className="admin-card-link">
            Открыть
          </Link>
        </article>
      </section>
    </main>
  );
}
