import "./RatingStars.css";

type RatingStarsProps = {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
};

export function RatingStars({
  value,
  onChange,
  readonly = false,
  size = "md",
}: RatingStarsProps) {
  return (
    <div className={`rating-stars rating-stars--${size}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= value;

        return (
          <button
            key={star}
            type="button"
            className={`rating-stars__star ${
              isActive ? "rating-stars__star--active" : ""
            }`}
            onClick={() => {
              if (!readonly) {
                onChange?.(star);
              }
            }}
            disabled={readonly}
            aria-label={`${star} из 5`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}