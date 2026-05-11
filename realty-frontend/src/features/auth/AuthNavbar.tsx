import { Link } from "react-router";
import "./AuthNavbar.css";

type AuthNavbarProps = {
  hideAbout?: boolean;
};

export function AuthNavbar({ hideAbout }: AuthNavbarProps) {
  return (
    <header className="auth-navbar">
      <Link to="/" className="auth-navbar-logo">
        <img src="/icons/home.svg" alt="logo" className="auth-navbar-logo-icon" />
        <span>City Stay</span>
      </Link>

      <nav className="auth-navbar-nav">
        {!hideAbout && <Link to="/about">О проекте</Link>}
        <Link to="/support">Поддержка</Link>
      </nav>
    </header>
  );
}