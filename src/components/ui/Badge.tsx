interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "success" | "warning" | "sky";
  className?: string;
}

const badgeVariants = {
  default: "bg-sand/60 text-ink-light",
  accent: "bg-accent/10 text-accent-dark",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  sky: "bg-sky/10 text-sky-dark",
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 text-xs font-semibold
        rounded-full tracking-wide uppercase
        ${badgeVariants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
