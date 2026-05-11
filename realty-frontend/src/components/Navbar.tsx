import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { getMyProfile, type UserProfile } from "../api/userApi";
import { ProtectedAvatar } from "./ProtecredAvatar";
import { useEffect, useState } from "react";
import "./Navbar.css";
import { isAdminOrModerator } from "../api/authApi";

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  

  const token = sessionStorage.getItem("token");

  const canOpenAdminPanel = token && isAdminOrModerator();
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!token) {
      setProfile(null);
      return;
    }

    getMyProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [token]);

  function logout() {
    sessionStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-changed"));
    setProfile(null);
    navigate("/login");
  }

  return (
    <header className="site-header">
      <Link to="/listings" className="site-header-logo">
        <img src="/icons/home.svg" alt="" />
        <span>StayVille</span>
      </Link>

      <nav className="site-header-nav">
        <NavLink to="/listings">Объявления</NavLink>
        <NavLink to="/about">О проекте</NavLink>

        {token && <NavLink to="/chats">Чаты</NavLink>}

        {canOpenAdminPanel && <NavLink to="/admin">Админ-панель</NavLink>}
      </nav>

      <div className="site-header-actions">
        {token ? (
          <>
            <Link to="/profile" className="site-header-avatar-link">
              <ProtectedAvatar
                avatarUrl={profile?.avatarUrl}
                fallback={profile?.name?.[0] ?? "П"}
                className="site-header-avatar"
                imgClassName="site-header-avatar-img"
              />
            </Link>

            <button
              type="button"
              className="site-header-logout"
              onClick={logout}
            >
              Выйти
            </button>
          </>
        ) : (
          <>
            {!isAuthPage && (
              <Link to="/login" className="site-header-login">
                Войти
              </Link>
            )}

            <Link to="/register" className="site-header-register">
              Регистрация
            </Link>
          </>
        )}
      </div>
    </header>
  );
}