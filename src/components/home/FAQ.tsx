"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const faqKeys = [
  { questionKey: "faq.questions.0.q", answerKey: "faq.questions.0.a" },
  { questionKey: "faq.questions.1.q", answerKey: "faq.questions.1.a" },
  { questionKey: "faq.questions.2.q", answerKey: "faq.questions.2.a" },
  { questionKey: "faq.questions.3.q", answerKey: "faq.questions.3.a" },
  { questionKey: "faq.questions.4.q", answerKey: "faq.questions.4.a" },
  { questionKey: "faq.questions.5.q", answerKey: "faq.questions.5.a" },
  { questionKey: "faq.questions.6.q", answerKey: "faq.questions.6.a" },
  { questionKey: "faq.questions.7.q", answerKey: "faq.questions.7.a" },
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
        aria-expanded={isOpen}
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
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <SectionHeading
          badge={t('faq.faqTitle')}
          title={t('faq.questionsWeveGotAnswers')}
          subtitle={t('faq.everythingYouNeedToKnow')}
        />

        <div className="bg-surface rounded-2xl border border-sand/60 px-6 lg:px-8">
          {faqKeys.map((faq, i) => (
            <FAQItem
              key={i}
              question={t(faq.questionKey)}
              answer={t(faq.answerKey)}
              isOpen={openIndex === i}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
