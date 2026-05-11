import { useNavigate } from "react-router";
import type { UserProfile } from "../../api/userApi";
import { ProtectedAvatar } from "../../components/ProtecredAvatar";
import { Link } from "react-router";
import { createSupportConversation } from "../../api/chatApi";

type ProfileTab =
  | "listings"
  | "applications"
  | "chats"
  | "reviews"
  | "settings";

type Props = {
  profile: UserProfile | null;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
};

export function ProfileSidebar({ profile, activeTab, onTabChange }: Props) {
  const navigate = useNavigate();

  const fullName = profile
    ? `${profile.name} ${profile.surname}`
    : "Пользователь";

  async function openSupportChat() {
    try {
      const conversation = await createSupportConversation();

      navigate(`/chats/${conversation.id}`, {
        state: {
          backTo: "/profile",
          backLabel: "В личный кабинет",
        },
      });
    } catch {
      alert("Не удалось открыть чат с поддержкой");
    }
  }

  return (
    <aside className="profile-sidebar">
      <ProtectedAvatar
        avatarUrl={profile?.avatarUrl}
        fallback={profile?.name?.[0] ?? "П"}
        className="profile-sidebar-avatar"
        imgClassName="profile-sidebar-avatar-img"
      />

      <h1>{fullName}</h1>
      <p>{profile?.phone ?? "Телефон не указан"}</p>

      <nav className="profile-menu">
        <button
          type="button"
          className={activeTab === "listings" ? "active" : ""}
          onClick={() => onTabChange("listings")}
        >
          Мои объявления
        </button>

        <button
          type="button"
          className={activeTab === "applications" ? "active" : ""}
          onClick={() => onTabChange("applications")}
        >
          Мои заявки
        </button>

        <Link
          to="/chats"
          state={{
            backTo: "/profile",
            backLabel: "В личный кабинет",
          }}
          className="profile-menu-link"
        >
          Чаты
        </Link>

        <button
          type="button"
          className={activeTab === "reviews" ? "active" : ""}
          onClick={() => onTabChange("reviews")}
        >
          Мои отзывы
        </button>

        <button
          type="button"
          className={activeTab === "settings" ? "active" : ""}
          onClick={() => onTabChange("settings")}
        >
          Настройки профиля
        </button>
      </nav>
      <div className="profile-support-box">
        <span>Нужна помощь?</span>
        <p>
          Напишите в службу поддержки, если возникли вопросы по объявлениям или
          заявкам.
        </p>

        <button type="button" onClick={openSupportChat}>
          Написать в поддержку
        </button>
      </div>
    </aside>
  );
}
