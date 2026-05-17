import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { login } from "../../api/authApi";
import "./LoginPage.css";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({
      email: "",
      password: "",
    });

    const errors = {
      email: "",
      password: "",
    };

    if (!email.trim()) {
      errors.email = "Введите email";
    }

    if (!password.trim()) {
      errors.password = "Введите пароль";
    }

    if (errors.email || errors.password) {
      setFieldErrors(errors);
      return;
    }

    try {
      const response = await login({
        email: email.trim(),
        password,
      });
      sessionStorage.setItem("token", response.token);
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/listings");
    } catch (err) {
      setError("Неверный email или пароль");
    }
  }

  return (
    <div className="login-page">
      <main className="login-main">
        <section className="login-promo-card">
          <div className="login-promo-content">
            <div className="login-promo-text">
              <h1>
                Добро
                <br />
                пожаловать в
                <br />
                StayVille
              </h1>

              <p>
                Арендуйте недвижимость, сдавайте свои объекты и отслеживайте
                статусы своих объявлений или заявок - всё в одном интерфейсе.
              </p>
            </div>

            <div className="login-promo-images">
              <img
                src="/images/auth/camapa.png"
                alt=""
                className="login-promo-image-large"
              />

              <div className="login-promo-images-small">
                <img src="/images/auth/interier.jpg" alt="" />
                <img src="/images/auth/balkon.jpg" alt="" />
              </div>
            </div>
          </div>

          <div className="login-feature-list">
            <div className="login-feature">
              <div className="login-feature-icon login-feature-icon--search">
                <img src="/icons/search_auth.svg" alt="" />
              </div>
              <div>
                <h3>Быстрый поиск объявлений</h3>
                <p>
                  Все объявления на одной странице с удобной системой фильтрации
                  и интерактивной картой.
                </p>
              </div>
            </div>

            <div className="login-feature">
              <div className="login-feature-icon login-feature-icon--chat">
                <img src="/icons/chat_icon_auth.svg" alt="" />
              </div>
              <div>
                <h3>Чат с владельцами и арендаторами</h3>
                <p>Быстрое общение прямиком на сайте.</p>
              </div>
            </div>

            <div className="login-feature">
              <div className="login-feature-icon login-feature-icon--pin">
                <img src="/icons/user_pin_auth.svg" alt="" />
              </div>
              <div>
                <h3>Индивидуальные рекомендации</h3>
                <p>Персональный перечень объявлений прямо под ваши интересы.</p>
              </div>
            </div>
          </div>

          <Link to="/about" className="login-about-button">
            Узнать больше
          </Link>
        </section>

        <section className="login-card">
          <div className="login-card-top">
            <Link to="/" className="login-card-logo">
              <img
                src="/icons/home.svg"
                alt="logo"
                className="login-logo-icon"
              />
              <span>StayVille</span>
            </Link>

            <p>
              Нет аккаунта? <Link to="/register">Регистрация</Link>
            </p>
          </div>

          <div className="login-card-title">
            <h2>Вход в аккаунт</h2>
            <p>
              Введите ваш email и пароль чтобы получить доступ к личному
              кабинету.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label>
              <span>Email</span>
              <input
                data-testid="login-email"
                className={fieldErrors.email ? "login-input-error" : ""}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ivan.petrov@company.com"
              />
              {fieldErrors.email && (
                <p className="login-field-error">{fieldErrors.email}</p>
              )}
            </label>

            <label>
              <span>Пароль</span>
              <input
                data-testid="login-password"
                className={fieldErrors.password ? "login-input-error" : ""}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите ваш пароль"
              />
              {fieldErrors.password && (
                <p className="login-field-error">{fieldErrors.password}</p>
              )}
            </label>

            <div className="login-form-row">
              <label className="login-checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Запомнить меня</span>
              </label>

              <Link to="/forgot-password">Забыли пароль?</Link>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button data-testid="login-submit" type="submit">Войти</button>
          </form>
        </section>
      </main>
    </div>
  );
}
