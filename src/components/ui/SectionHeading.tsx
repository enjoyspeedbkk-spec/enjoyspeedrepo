"use client";

import { motion } from "framer-motion";
import { Badge } from "./Badge";

interface SectionHeadingProps {
  badge?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}

export function SectionHeading({
  badge,
  title,
  subtitle,
  align = "center",
}: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`mb-12 lg:mb-16 ${align === "center" ? "text-center" : ""}`}
    >
      {badge && (
        <div className={`mb-4 ${align === "center" ? "flex justify-center" : ""}`}>
          <Badge variant="accent">{badge}</Badge>
        </div>
      )}
      <h2 className="text-balance max-w-3xl mx-auto">{title}</h2>
      {subtitle && (
        <p className="mt-4 text-lg text-ink-muted max-w-2xl mx-auto text-balance">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
