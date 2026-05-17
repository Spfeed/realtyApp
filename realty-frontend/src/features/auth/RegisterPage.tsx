import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { register } from "../../api/authApi";
import { createProfile } from "../../api/userApi";
import "./RegisterPage.css";
import { PersonalDataModal } from "./PersonalDataModal";

type FormErrors = {
  email?: string;
  password?: string;
  repeatPassword?: string;
  surname?: string;
  name?: string;
  patronymic?: string;
  phone?: string;
  acceptedTerms?: string;
};

export function RegisterPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  const [surname, setSurname] = useState("");
  const [name, setName] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [phone, setPhone] = useState("");

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [isPersonalDataModalOpen, setIsPersonalDataModalOpen] = useState(false);

  function validateForm() {
    const nextErrors: FormErrors = {};

    const nameRegex = /^[А-Яа-яЁёA-Za-z\s-]+$/;
    const phoneRegex = /^\+?\d{11,12}$/;
    const passwordHasLetters = /[A-Za-zА-Яа-яЁё]/.test(password);
    const passwordHasNumbers = /\d/.test(password);

    const passwordHasLowerCase = /[a-zа-яё]/.test(password);
    const passwordHasUpperCase = /[A-ZА-ЯЁ]/.test(password);

    if (!email.trim()) {
      nextErrors.email = "Введите email";
    }

    if (!surname.trim()) {
      nextErrors.surname = "Введите фамилию";
    } else if (!nameRegex.test(surname)) {
      nextErrors.surname =
        "Фамилия может содержать только буквы, пробел и дефис";
    }

    if (!name.trim()) {
      nextErrors.name = "Введите имя";
    } else if (!nameRegex.test(name)) {
      nextErrors.name = "Имя может содержать только буквы, пробел и дефис";
    }

    if (patronymic.trim() && !nameRegex.test(patronymic)) {
      nextErrors.patronymic =
        "Отчество может содержать только буквы, пробел и дефис";
    }

    if (!phone.trim()) {
      nextErrors.phone = "Введите номер телефона";
    } else if (!phoneRegex.test(phone)) {
      nextErrors.phone =
        "Телефон должен содержать 11–12 цифр, можно с + в начале";
    }

    if (!password) {
      nextErrors.password = "Введите пароль";
    } else if (password.length < 8) {
      nextErrors.password = "Пароль должен быть не меньше 8 символов";
    } else if (!passwordHasLetters || !passwordHasNumbers) {
      nextErrors.password = "Пароль должен содержать буквы и цифры";
    } else if (!passwordHasLowerCase || !passwordHasUpperCase) {
      nextErrors.password =
        "Пароль должен содержать символы верхнего и нижнего регистра";
    }

    if (!repeatPassword) {
      nextErrors.repeatPassword = "Повторите пароль";
    } else if (password !== repeatPassword) {
      nextErrors.repeatPassword = "Пароли не совпадают";
    }

    if (!acceptedTerms) {
      nextErrors.acceptedTerms = "Необходимо принять условия обработки данных";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    if (!validateForm()) return;

    try {
      const authResponse = await register({ email, password });

      sessionStorage.setItem("token", authResponse.token);
      window.dispatchEvent(new Event("auth-changed"));

      await createProfile({
        surname,
        name,
        patronymic: patronymic || undefined,
        phone,
      });

      navigate("/profile");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Ошибка регистрации";

      if (
        message.toLowerCase().includes("exists") ||
        message.toLowerCase().includes("already") ||
        message.toLowerCase().includes("уже")
      ) {
        setServerError("Пользователь с таким email уже существует");
      } else {
        setServerError(message);
      }
    }
  }

  return (
    <div className="register-screen">
      <main className="register-page">
        <section className="register-promo-card">
          <div className="register-promo-content">
            <div className="register-promo-text">
              <h1>
                Добро пожаловать в
                <br />
                StayVille
              </h1>

              <p>
                Найдите и бронируйте квартиры на короткий и долгий срок.
                Управляйте бронированиями, общайтесь с хостами и получайте
                поддержку 24/7.
              </p>

              <ul>
                <li>Интуитивный поиск и прозрачные фильтры</li>
                <li>Быстрая связь с владельцем или арендатором</li>
                <li>Поддержка хостов и гостей в режиме 24/7</li>
              </ul>
            </div>

            <div className="register-promo-images">
              <img
                src="/images/register/panorama.jpeg"
                alt=""
                className="register-main-image"
              />
            </div>
          </div>

          <div className="register-promo-bottom">
            <div className="register-mini-card">
              <img src="/images/register/gorod_visota.jpg" alt="" />
              <span>Квартиры в центре</span>
            </div>

            <div className="register-mini-card">
              <img src="/images/register/support.jpg" alt="" />
              <span>Связь между сторонами</span>
            </div>
          </div>
        </section>

        <section className="register-benefits">
          <div>
            <h3>Быстрая связь</h3>
            <p>Общайтесь с владельцами или арендаторами во встроенном чате</p>
          </div>

          <div>
            <h3>Подробная фильтрация</h3>
            <p>Отбирайте наиболее подходящие объявления!</p>
          </div>

          <div>
            <h3>Отзывы и рейтинги</h3>
            <p>Честные оценки от гостей и хостов для прозрачности.</p>
          </div>
        </section>

        <section className="register-card">
          <div className="register-accent-line" />

          <div className="register-card-content">
            <div className="register-title">
              <h2>Создать аккаунт</h2>
              <p>Быстрое и безопасное создание профиля</p>
            </div>

            <form className="register-form" onSubmit={handleSubmit}>
              <label className="register-field register-field-full">
                <span>Email</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ivan.petrov@example.com"
                />
                {errors.email && <small>{errors.email}</small>}
              </label>

              <label className="register-field">
                <span>Фамилия</span>
                <input
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  placeholder="Петров"
                />
                {errors.surname && <small>{errors.surname}</small>}
              </label>

              <label className="register-field">
                <span>Имя</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Иван"
                />
                {errors.name && <small>{errors.name}</small>}
              </label>

              <label className="register-field">
                <span>Отчество</span>
                <input
                  value={patronymic}
                  onChange={(e) => setPatronymic(e.target.value)}
                  placeholder="Сергеевич"
                />
                {errors.patronymic && <small>{errors.patronymic}</small>}
              </label>

              <label className="register-field">
                <span>Номер телефона</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 9123456789"
                />
                {errors.phone && <small>{errors.phone}</small>}
              </label>

              <label className="register-field">
                <span>Пароль</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 8 символов"
                />
                {errors.password && <small>{errors.password}</small>}
              </label>

              <label className="register-field">
                <span>Повтор пароля</span>
                <input
                  type="password"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  placeholder="Повторите пароль"
                />
                {errors.repeatPassword && (
                  <small>{errors.repeatPassword}</small>
                )}
              </label>

              <div className="register-bottom-row">
                <label className="register-checkbox">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                  />
                  <span>
                    Я принимаю условия
                    <br />
                    <span
                      className="register-personal-data-link"
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsPersonalDataModalOpen(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsPersonalDataModalOpen(true);
                        }
                      }}
                    >
                      обработки персональных данных
                    </span>
                  </span>
                </label>

                <button type="submit">Создать аккаунт</button>
              </div>

              {errors.acceptedTerms && (
                <p className="register-error">{errors.acceptedTerms}</p>
              )}

              {serverError && <p className="register-error">{serverError}</p>}
            </form>

            <p className="register-login-link">
              Есть аккаунт? <Link to="/login">Войти</Link>
            </p>
          </div>
        </section>
        <PersonalDataModal
          isOpen={isPersonalDataModalOpen}
          onClose={() => setIsPersonalDataModalOpen(false)}
        />
      </main>
    </div>
  );
}
