"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  CreditCard,
  MessageCircle,
  Bike,
  Camera,
  Heart,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";

const steps = [
  {
    number: "01",
    icon: CalendarDays,
    title: "Pick your ride",
    description:
      "Choose your date, time slot, and group size. See pricing instantly. Book at least 24 hours ahead.",
  },
  {
    number: "02",
    icon: CreditCard,
    title: "Pay seamlessly",
    description:
      "Scan the PromptPay QR with your amount auto-calculated. No manual inputs, no friction.",
  },
  {
    number: "03",
    icon: MessageCircle,
    title: "Get prepped via LINE",
    description:
      "Receive your meetup location, ride details, and preparation tips. Complete your rider profile.",
  },
  {
    number: "04",
    icon: Bike,
    title: "Ride with confidence",
    description:
      "Your Athlete Leader guides the pace. Hero riders keep you safe. Just pedal and enjoy.",
  },
  {
    number: "05",
    icon: Camera,
    title: "Capture the moment",
    description:
      "Professional photography included. Get your shots from the ride delivered after the session.",
  },
  {
    number: "06",
    icon: Heart,
    title: "Recover & relax",
    description:
      "Cold towels, electrolyte drinks, and recovery refreshments. End the ride feeling taken care of.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 lg:py-32 bg-surface">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          badge="The Experience"
          title="From booking to recovery, we handle everything"
          subtitle="Six steps. Zero stress. Every detail curated so you can focus on what matters: the ride."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="relative"
            >
              {/* Step number */}
              <span className="text-5xl font-bold text-sand/60 font-heading select-none">
                {step.number}
              </span>

              {/* Icon */}
              <div className="mt-3 inline-flex items-center justify-center w-11 h-11 rounded-xl bg-accent/8 border border-accent/10">
                <step.icon className="h-5 w-5 text-accent" />
              </div>

              {/* Content */}
              <h3 className="mt-4 text-lg font-bold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
