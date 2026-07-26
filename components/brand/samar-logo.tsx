import Image from "next/image";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

type SamarLogoVariant = "mark" | "wordmark" | "lockup";

interface SamarLogoProps {
  variant?: SamarLogoVariant;
  className?: string;
  /** Height in pixels for the mark (lockup/mark) or wordmark alone. */
  height?: number;
  priority?: boolean;
}

export function SamarLogo({
  variant = "lockup",
  className,
  height = 28,
  priority = false,
}: SamarLogoProps) {
  if (variant === "mark") {
    return (
      <Image
        src={BRAND.mark}
        alt={BRAND.name}
        width={Math.round(height * (661 / 465))}
        height={height}
        className={cn("h-auto w-auto object-contain", className)}
        style={{ height, width: "auto" }}
        priority={priority}
      />
    );
  }

  if (variant === "wordmark") {
    return (
      <Image
        src={BRAND.wordmark}
        alt={BRAND.name}
        width={Math.round(height * (1004 / 147))}
        height={height}
        className={cn("h-auto w-auto object-contain", className)}
        style={{ height, width: "auto" }}
        priority={priority}
      />
    );
  }

  const markHeight = height;
  const wordHeight = Math.max(14, Math.round(height * 0.55));

  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      aria-label={BRAND.name}
    >
      <Image
        src={BRAND.mark}
        alt=""
        width={Math.round(markHeight * (661 / 465))}
        height={markHeight}
        className="h-auto w-auto object-contain"
        style={{ height: markHeight, width: "auto" }}
        priority={priority}
      />
      <Image
        src={BRAND.wordmark}
        alt={BRAND.name}
        width={Math.round(wordHeight * (1004 / 147))}
        height={wordHeight}
        className="h-auto w-auto object-contain"
        style={{ height: wordHeight, width: "auto" }}
        priority={priority}
      />
    </span>
  );
}
