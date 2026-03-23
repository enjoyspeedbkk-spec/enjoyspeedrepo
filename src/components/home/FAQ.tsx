"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";

const faqs = [
  {
    question: "Do I need to bring my own bike?",
    answer:
      "You can! But we also offer bike rentals through HHBL (Happy and Healthy Bike Lane). Hybrid bikes are 420 THB and road bikes are 720 THB per session. Helmet is included with every rental. All rental bikes are professionally maintained and ready to ride. Just select your preference when booking.",
  },
  {
    question: "What fitness level do I need?",
    answer:
      "Our rides cover approximately 23.5 km on Bangkok's Skylane. You should be comfortable cycling for about 2 hours at a moderate pace. Our Leaders adjust the pace to the group.",
  },
  {
    question: "What happens if it rains?",
    answer:
      "We monitor weather conditions closely. If rain is likely, we'll notify you in advance through LINE and offer options including rescheduling or a refund based on our weather policy.",
  },
  {
    question: "Do I need cycling insurance?",
    answer:
      "We recommend riders have their own personal accident insurance or travel insurance for peace of mind. All rental bikes include insurance coverage provided by the rental shop. You'll complete a safety waiver during onboarding before your ride.",
  },
  {
    question: "How far in advance should I book?",
    answer:
      "Bookings must be made at least 24 hours before the session. Sessions often fill up quickly, especially evening golden hour slots, so we recommend booking early.",
  },
  {
    question: "What's included in the price?",
    answer:
      "Every ride includes Athlete Leader guidance, Hero support riders, ride photography, a Starter Kit (padded cycling liners, energy gel, eco mesh bag — 640 THB value, included), post-ride electrolyte drinks and recovery refreshments, safety briefing, and weather monitoring. Bike rental is the only additional cost. The Starter Kit does not include a bidon (cycling water bottle) — please bring your own or let us know in advance to arrange one (extra cost).",
  },
  {
    question: "Can I cancel or reschedule?",
    answer:
      "Yes, through your account or via LINE. Cancellation and refund terms depend on timing and weather conditions. Full details are provided during booking.",
  },
  {
    question: "What should I bring?",
    answer:
      "Comfortable cycling clothing, sunscreen, and a cycling bidon (water bottle) — normal bottles won't fit the bike holder. If renting a bike, a helmet is included. If bringing your own bike, you'll need your own helmet (required). We provide everything else in your Starter Kit.",
  },
];

function FAQItem({
  question,
  answer,
  isOpen,
  onClick,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div className="border-b border-sand/60 last:border-0">
      <button
        onClick={onClick}
        className="flex items-center justify-between w-full py-5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-lg px-2 -mx-2"
      >
        <span className="text-base font-semibold text-ink group-hover:text-accent transition-colors pr-4">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="h-5 w-5 text-ink-muted" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-ink-muted leading-relaxed pr-12">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <SectionHeading
          badge="FAQ"
          title="Questions? We've got answers"
          subtitle="Everything you need to know before your first ride."
        />

        <div className="bg-surface rounded-2xl border border-sand/60 px-6 lg:px-8">
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === i}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
