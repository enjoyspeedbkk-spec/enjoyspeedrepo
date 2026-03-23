"use client";

import { motion } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
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
}: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`
        rounded-2xl bg-surface border border-sand/60
        shadow-sm
        ${hover ? "hover:shadow-lg hover:border-sand cursor-pointer" : ""}
        ${paddings[padding]}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
