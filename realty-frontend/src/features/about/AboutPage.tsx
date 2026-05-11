import "./AboutPage.css";

export function AboutPage() {
  return (
    <>
      <main className="about-page">
        {/* HERO */}
        <section className="about-hero-grid">
          <div className="about-hero-text">
            <h1>О проекте</h1>
            <p>
              StayVille создан, чтобы вы могли с комфортом снять жильё на
              короткий или долгий срок или легко сдать свою квартиру другим
              гостям.
            </p>

            <div className="about-features">
              <div className="about-feature-card">
                <img
                  src="/icons/couch.svg"
                  alt=""
                  className="about-feature-icon"
                />
                <h3>Аренда с комфортом</h3>
                <p>Подробные карточки квартир и удобные фильтры.</p>
              </div>

              <div className="about-feature-card">
                <img
                  src="/icons/user_tie.svg"
                  alt=""
                  className="about-feature-icon"
                />
                <h3>Сдать без проблем</h3>
                <p>Простой интерфейс для размещения объявлений.</p>
              </div>

              <div className="about-feature-card">
                <img
                  src="/icons/comments.svg"
                  alt=""
                  className="about-feature-icon"
                />
                <h3>Встроенный чат</h3>
                <p>Общайтесь напрямую в приложении.</p>
              </div>
            </div>
          </div>

          <img
            src="/images/about/moscow.jpg"
            alt="Город красивый"
            className="about-city-image"
          />
        </section>

        <section className="about-grid">
          {/* LEFT COLUMN */}
          <div className="about-left">
            <div className="about-card">
              <h2>Комфорт при съёме</h2>
              <p>
                Каждая карточка объекта содержит список удобств, фотографии,
                отзывы и календарь.
              </p>

              <ul className="about-list">
                <li>
                  <img src="/icons/check.svg" alt="" />
                  <span>Удобный календарь</span>
                </li>
                <li>
                  <img src="/icons/check.svg" alt="" />
                  <span>Фото высокого качества</span>
                </li>
                <li>
                  <img src="/icons/check.svg" alt="" />
                  <span>Фильтры и рейтинги</span>
                </li>
              </ul>
            </div>

            <div className="about-card">
              <h2>Встроенный чат</h2>
              <p>
                Общайтесь с владельцами, обсуждайте детали и договаривайтесь
                напрямую.
              </p>

              <div className="about-chat-features">
                <div className="about-mini-card accent">Быстрые шаблоны</div>
                <div className="about-mini-card">Медиа и файлы</div>
              </div>
            </div>
          </div>

          <div className="about-card">
            <h2>Интерактивная карта</h2>
            <div className="about-map-placeholder" />
            <p>Позволяет находить объекты рядом и оценивать район.</p>
          </div>
        </section>

        {/* STEPS */}
        <section className="about-steps">
          <h2>Как это работает</h2>

          <div className="about-steps-row">
            <div className="about-step">
              <span>1</span>
              <h3>Найдите жильё</h3>
              <p>Используйте фильтры и карту</p>
            </div>

            <div className="about-step">
              <span>2</span>
              <h3>Свяжитесь</h3>
              <p>Обсудите детали с владельцем</p>
            </div>

            <div className="about-step">
              <span>3</span>
              <h3>Заселение</h3>
              <p>Приезжайте и заселяйтесь</p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
