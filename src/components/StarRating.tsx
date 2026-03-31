"use client";

interface StarRatingProps {
  rating: number;
  onRate?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
}

export default function StarRating({
  rating,
  onRate,
  size = "md",
  interactive = false,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "text-lg gap-0.5",
    md: "text-2xl gap-1",
    lg: "text-4xl gap-1.5",
  };

  return (
    <div className={`flex items-center ${sizeClasses[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(star)}
          className={`transition-all ${
            interactive ? "hover:scale-125 cursor-pointer" : "cursor-default"
          } ${star <= rating ? "opacity-100" : "opacity-30"}`}
        >
          {star <= rating ? "🌿" : "🌿"}
        </button>
      ))}
    </div>
  );
}
