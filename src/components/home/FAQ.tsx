"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";

const faqs = [
  {
    question: "Do I need to bring my own bike?",
    answer:
      "You can! But we also offer bike rentals. Hybrid bikes are 420 THB and road bikes are 700 THB per session. Just select your preference when booking.",
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
      "Yes, riders must have their own insurance. Our service does not include personal injury or damage insurance. This is part of our safety waiver which you'll complete during onboarding.",
  },
  {
    question: "How far in advance should I book?",
    answer:
      "Bookings must be made at least 24 hours before the session. Sessions often fill up quickly, especially evening golden hour slots, so we recommend booking early.",
  },
  {
    question: "What's included in the price?",
    answer:
      "Every ride includes Athlete Leader guidance, Hero support riders, professional photography, post-ride cold towels, electrolyte drinks, and recovery refreshments. Bike rental is the only additional cost.",
  },
  {
    question: "Can I cancel or reschedule?",
    answer:
      "Yes, through your account or via LINE. Cancellation and refund terms depend on timing and weather conditions. Full details are provided during booking.",
  },
  {
    question: "What should I bring?",
    answer:
      "A helmet (required), comfortable cycling clothing, sunscreen, and water. If you're renting a bike, that's all you need. We provide everything else.",
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
        className="flex items-center justify-between w-full py-5 text-left group"
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
