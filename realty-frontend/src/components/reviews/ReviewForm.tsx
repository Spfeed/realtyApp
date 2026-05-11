import { useState } from "react";
import { RatingStars } from "./RatingStars";
import "./ReviewForm.css";

type Props = {
  targetType: "LISTING" | "LANDLORD";
  targetId: number;
  onSuccess?: () => void; // чтобы обновить список после отправки
};

export function ReviewForm({ targetType, targetId, onSuccess }: Props) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Поставьте оценку");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          targetType,
          targetId,
          rating,
          text: text.trim() || null,
        }),
      });

      if (!res.ok) {
        throw new Error("Ошибка при отправке отзыва");
      }

      // сброс формы
      setRating(0);
      setText("");

      onSuccess?.();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Не удалось отправить отзыв"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h3>Оставить отзыв</h3>

      <div className="review-form-rating">
        <span>Ваша оценка:</span>
        <RatingStars value={rating} onChange={setRating} />
      </div>

      <textarea
        placeholder="Напишите ваш отзыв (необязательно)"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {error && <p className="review-form-error">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Отправка..." : "Отправить"}
      </button>
    </form>
  );
}