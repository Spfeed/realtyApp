import { useEffect, useState } from "react";
import "./PersonalDataModal.css";

type PersonalDataModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function PersonalDataModal({ isOpen, onClose }: PersonalDataModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      return;
    }

    const timeoutId = setTimeout(() => {
      setShouldRender(false);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div
      className={`personal-data-modal-overlay ${
        isOpen ? "personal-data-modal-overlay--open" : "personal-data-modal-overlay--closing"
      }`}
      onClick={onClose}
    >
      <div
        className={`personal-data-modal ${
          isOpen ? "personal-data-modal--open" : "personal-data-modal--closing"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="personal-data-modal-close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>

        <h2>Обработка персональных данных</h2>

        <p>
          Персональные данные используются для работы сервиса StayVille:
          создания профиля, связи с пользователями и корректной работы личного
          кабинета.
        </p>

        <p>
          Также данные пользователя могут использоваться для работы
          рекомендательной системы, чтобы подбирать персональные предложения и
          показывать объявления, которые лучше соответствуют интересам
          пользователя.
        </p>

        <button
          type="button"
          className="personal-data-modal-button"
          onClick={onClose}
        >
          Понятно
        </button>
      </div>
    </div>
  );
}