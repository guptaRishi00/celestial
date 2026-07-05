import Image from "next/image";

/**
 * Pandit Ji's avatar — the brand logo cropped to its central star (same mark as the
 * header), used everywhere the assistant is represented. Replaces the previous folded-hands
 * emoji so the chat reads as a real, branded product rather than an emoji placeholder.
 *
 * `className` sizes the (responsive) circular container; `imgPx` is the rendered logo
 * size — keep it ~1.8–2× the largest container width so the star fills the circle.
 */
export default function PanditAvatar({
  className = "",
  imgPx = 72,
}: {
  className?: string;
  imgPx?: number;
}) {
  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded-full ring-1 ring-inset ring-hero-accent/30 bg-gradient-to-br from-hero-accent/25 to-hero-warm/20 shadow-[0_0_15px_rgba(196,161,255,0.15)] ${className}`}
    >
      <Image
        src="/logo.png"
        alt="Pandit Shastri Ji"
        width={imgPx}
        height={imgPx}
        className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
      />
    </span>
  );
}
