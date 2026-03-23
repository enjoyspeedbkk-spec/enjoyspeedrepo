"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform, useMotionValue } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  format?: "number" | "currency";
  duration?: number;
}

/**
 * Apple-style animated number that smoothly transitions between values.
 * Uses spring physics for a natural, premium feel.
 */
export function AnimatedNumber({
  value,
  className = "",
  format = "number",
  duration = 0.5,
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(value);
  const springValue = useSpring(motionValue, {
    stiffness: 400,
    damping: 35,
    mass: 0.3,
  });
  const [display, setDisplay] = useState(
    format === "currency" ? value.toLocaleString() : String(value)
  );

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      const rounded = Math.round(latest);
      setDisplay(
        format === "currency" ? rounded.toLocaleString() : String(rounded)
      );
    });
    return unsubscribe;
  }, [springValue, format]);

  return <span className={className}>{display}</span>;
}

/**
 * Animated number with a vertical slide effect (like a slot machine).
 * Each digit slides up/down independently.
 */
export function SlotNumber({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return (
    <motion.span
      key={value}
      initial={{ y: 10, opacity: 0, filter: "blur(2px)" }}
      animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
      exit={{ y: -10, opacity: 0, filter: "blur(2px)" }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
      }}
      className={`inline-block ${className}`}
    >
      {value}
    </motion.span>
  );
}

/**
 * Animated price with smooth counting and formatting.
 */
export function AnimatedPrice({
  value,
  className = "",
  suffix = "",
}: {
  value: number;
  className?: string;
  suffix?: string;
}) {
  return (
    <span className={className}>
      <AnimatedNumber value={value} format="currency" />
      {suffix && <span>{suffix}</span>}
    </span>
  );
}
