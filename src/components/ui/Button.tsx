"use client";

import { forwardRef } from "react";
import { ChevronRight, Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  arrow?: boolean;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-ink text-cream hover:bg-ink-light shadow-sm hover:shadow-md",
  secondary:
    "bg-accent text-white hover:bg-accent-dark shadow-sm hover:shadow-md",
  outline:
    "bg-transparent border-2 border-ink/15 text-ink hover:border-ink/30 hover:bg-sand/30",
  ghost:
    "bg-transparent text-ink-light hover:text-ink hover:bg-sand/40",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm rounded-lg gap-1.5",
  md: "px-6 py-3 text-sm rounded-xl gap-2",
  lg: "px-8 py-4 text-base rounded-2xl gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    arrow = false,
    fullWidth = false,
    className = "",
    children,
    disabled,
    onClick,
    type = "button",
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-300
        hover:scale-[1.02] active:scale-[0.98]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      disabled={disabled || loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {children}
          {arrow && (
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          )}
        </>
      )}
    </button>
  );
});
