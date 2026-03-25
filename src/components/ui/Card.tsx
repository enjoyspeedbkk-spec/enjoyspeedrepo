interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
  onClick?: () => void;
}

const paddings = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  children,
  className = "",
  hover = false,
  padding = "md",
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      className={`
        rounded-2xl bg-surface border border-sand/60
        shadow-sm
        ${hover ? "hover:shadow-lg hover:border-sand hover:-translate-y-1 cursor-pointer transition-all duration-300 ease-out" : ""}
        ${onClick ? "cursor-pointer focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none" : ""}
        ${paddings[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
