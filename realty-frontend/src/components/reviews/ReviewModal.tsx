import { useEffect, useState } from "react";
import { RatingStars } from "./RatingStars";
import { ProtectedAvatar } from "../ProtecredAvatar";
import "./ReviewModal.css";
import {
  createReview,
  updateReview,
  deleteReview,
  type ReviewResponse,
} from "../../api/reviewApi";
import { AverageRating } from "./AverageRating";

type Props = {
  isOpen: boolean;
  onClose: () => void;

  targetType: "LISTING" | "LANDLORD";
  targetId: number;

  title: string;
  subtitle: string;
  avatarUrl?: string | null;
  fallback: string;

  reviews: ReviewResponse[];

  reviewToEdit?: ReviewResponse | null;
  onSuccess?: () => void | Promise<void>;
};

export function ReviewModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  title,
  subtitle,
  avatarUrl,
  fallback,
  reviews,
  reviewToEdit = null,
  onSuccess,
}: Props) {
  const [mounted, setMounted] = useState(isOpen);
  const [closing, setClosing] = useState(false);

  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isEditMode = Boolean(reviewToEdit);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setClosing(false);
    } else if (mounted) {
      setClosing(true);

      const timer = setTimeout(() => {
        setMounted(false);
        setClosing(false);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [isOpen, mounted]);

  useEffect(() => {
    if (!isOpen) return;

    if (reviewToEdit) {
      setRating(reviewToEdit.rating);
      setText(reviewToEdit.text ?? "");
    } else {
      setRating(0);
      setText("");
    }

    setError("");
  }, [isOpen, reviewToEdit]);

  useEffect(() => {
    if (!isOpen) return;

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClose();
      }
    }

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  function handleClose() {
    if (loading) return;
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Поставьте оценку");
      return;
    }

    try {
      setLoading(true);

      if (reviewToEdit) {
        await updateReview(reviewToEdit.id, {
          rating,
          text: text.trim() || undefined,
        });
      } else {
        await createReview({
          targetType,
          targetId,
          rating,
          text: text.trim() || undefined,
        });
      }

      setRating(0);
      setText("");

      await onSuccess?.();
      onClose();
    } catch (e) {
      setError(
        isEditMode
          ? "Не удалось обновить отзыв. Попробуйте ещё раз."
          : "Вы уже оставляли отзыв этому владельцу или объекту. Если ваше мнение изменилось — можете отредактировать свой отзыв.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!reviewToEdit) return;

    const confirmed = window.confirm(
      "Удалить отзыв? Это действие нельзя отменить.",
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError("");

      await deleteReview(reviewToEdit.id);

      setRating(0);
      setText("");

      await onSuccess?.();
      onClose();
    } catch {
      setError("Не удалось удалить отзыв. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  const modalSubtitle =
    targetType === "LISTING"
      ? "Поделитесь впечатлением об объекте недвижимости"
      : "Поделитесь опытом взаимодействия с владельцем";

  const ratingLabel =
    targetType === "LISTING" ? "Оцените объект" : "Оцените владельца";

  return (
    <div
      className={`review-modal-overlay ${closing ? "review-modal-overlay--closing" : ""}`}
      onMouseDown={handleClose}
    >
      <form
        className="review-modal-card"
        onSubmit={handleSubmit}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="review-modal-close"
          onClick={handleClose}
          disabled={loading}
          aria-label="Закрыть"
        >
          ×
        </button>

        <h2>{isEditMode ? "Редактировать отзыв" : "Оставить отзыв"}</h2>
        <p className="review-modal-subtitle">{modalSubtitle}</p>

        <div className="review-modal-target">
          <ProtectedAvatar
            avatarUrl={avatarUrl}
            fallback={fallback}
            className="review-modal-avatar"
            imgClassName="review-modal-avatar-img"
          />

          <div>
            <h3>{title}</h3>
            <p>{subtitle}</p>

            <div className="review-modal-rating-summary">
              <span className="review-modal-average">
                <AverageRating reviews={reviews} />
              </span>
            </div>
          </div>
        </div>

        <div className="review-modal-divider" />

        <label className="review-modal-label">{ratingLabel}</label>

        <div className="review-modal-stars-row">
          <RatingStars value={rating} onChange={setRating} size="lg" />
          <span>Нажмите на звёзды, чтобы выбрать оценку</span>
        </div>

        <label className="review-modal-text-row">
          <span>Текст отзыва</span>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 1000))}
            placeholder="Поделитесь вашим опытом: общение, пунктуальность, честность, удобство взаимодействия"
          />
        </label>

        <div className="review-modal-counter">{text.length} / 1000</div>

        {error && <p className="review-modal-error">{error}</p>}

        <div className="review-modal-actions">
          {isEditMode && (
            <button
              type="button"
              className="review-modal-delete"
              onClick={handleDelete}
              disabled={loading}
            >
              Удалить отзыв
            </button>
          )}

          <div className="review-modal-actions-right">
            <button
              type="button"
              className="review-modal-cancel"
              onClick={handleClose}
              disabled={loading}
            >
              Отмена
            </button>

            <button
              type="submit"
              className="review-modal-submit"
              disabled={loading}
            >
              {loading
                ? isEditMode
                  ? "Сохраняем..."
                  : "Отправка..."
                : isEditMode
                  ? "Сохранить"
                  : "Отправить"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
