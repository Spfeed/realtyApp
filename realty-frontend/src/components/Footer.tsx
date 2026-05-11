import { useEffect, useState } from "react";
import { Link } from "react-router";
import "./Footer.css";

export function Footer() {
  const [token, setToken] = useState(() => sessionStorage.getItem("token"));

  useEffect(() => {
    function syncToken() {
      setToken(sessionStorage.getItem("token"));
    }

    window.addEventListener("storage", syncToken);
    window.addEventListener("auth-changed", syncToken);

    syncToken();

    return () => {
      window.removeEventListener("storage", syncToken);
      window.removeEventListener("auth-changed", syncToken);
    };
  }, []);

  const isAuthenticated = Boolean(token);

  return (
    <footer className="site-footer">
      <div className="site-footer-brand">
        <Link to="/listings" className="site-footer-logo">
          <img src="/icons/home.svg" alt="" />
          <span>StayVille</span>
        </Link>

        <p>
          Сервис для поиска жилья, общения с владельцами и управления арендой.
        </p>
      </div>

      <nav className="site-footer-links">
        <Link to="/listings">Объявления</Link>
        <Link to="/about">О проекте</Link>

        {isAuthenticated ? (
          <>
            <Link to="/profile">Личный кабинет</Link>
            <Link to="/chats">Чаты</Link>
          </>
        ) : (
          <>
            <Link to="/login">Войти</Link>
            <Link to="/register">Регистрация</Link>
          </>
        )}
      </nav>

      <div className="site-footer-meta">
        <span>© {new Date().getFullYear()} StayVille</span>
        <span>Учебный проект</span>
      </div>
    </footer>
  );
}