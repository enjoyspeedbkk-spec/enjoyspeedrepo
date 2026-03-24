"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Award, Shield, Heart, Star } from "lucide-react";

const team = [
  {
    name: "Coach Pailin",
    role: "Athlete Leader & Co-Founder",
    image: "/images/team/pailin-1.jpg",
    bio: "Experienced cycling coach and LKB Cycling Club member. Pailin leads the morning golden hour rides and brings warmth, energy, and precision to every session. Her focus: making every rider feel confident from the first pedal stroke.",
    specialties: ["Golden Hour Specialist", "First-Timer Friendly", "Safety Lead"],
  },
  {
    name: "Coach Udorn",
    role: "Athlete Leader & Co-Founder",
    image: "/images/team/udorn-1.jpg",
    bio: "Veteran cyclist and ride architect. Udorn designs the route pacing, manages group dynamics, and ensures every ride runs with military precision and genuine heart. He'll match your pace, push you just enough, and make sure you finish with a smile.",
    specialties: ["Pace Strategy", "Group Dynamics", "Route Design"],
  },
];

const credentials = [
  {
    icon: Award,
    label: "LKB Cycling Club",
    sub: "Official cycling club members",
  },
  {
    icon: Shield,
    label: "Safety Trained",
    sub: "Emergency & first aid prepared",
  },
  {
    icon: Heart,
    label: "Passionate Cyclists",
    sub: "Years of riding experience",
  },
  {
    icon: Star,
    label: "Small Group Focus",
    sub: "Personal attention every ride",
  },
];

export function TeamSection({ imageOverrides }: { imageOverrides?: Record<string, string> } = {}) {
  const getImage = (key: string, fallback: string) => imageOverrides?.[key] || fallback;
  return (
    <section className="py-20 lg:py-28 bg-cream overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-3">
            Your Leaders
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-ink max-w-2xl mx-auto">
            Meet the people who make every ride unforgettable
          </h2>
          <p className="mt-4 text-ink-muted max-w-lg mx-auto">
            Our Athlete Leaders aren&apos;t just guides — they&apos;re experienced
            cyclists who&apos;ve dedicated themselves to making this the ride of
            your life.
          </p>
        </motion.div>

        {/* Coach cards */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="bg-white rounded-2xl border border-sand/40 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Photo */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={getImage(member.name === "Coach Pailin" ? "team-pailin-profile" : "team-udorn-profile", member.image)}
                  alt={`${member.name} — ${member.role}`}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-xl font-bold text-white">
                    {member.name}
                  </h3>
                  <p className="text-sm text-white/80 font-medium">
                    {member.role}
                  </p>
                </div>
              </div>

              {/* Bio */}
              <div className="p-6">
                <p className="text-sm text-ink-muted leading-relaxed">
                  {member.bio}
                </p>

                {/* Specialty tags */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {member.specialties.map((s) => (
                    <span
                      key={s}
                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent/8 text-accent-dark border border-accent/10"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Team photo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <div className="relative aspect-[3/4] sm:aspect-[4/3] max-w-2xl mx-auto rounded-2xl overflow-hidden">
            <Image
              src={getImage("team-group-photo", "/images/team/team-dawn.jpg")}
              alt="The En-Joy Speed team at dawn, ready to ride"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 700px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
              <p className="text-white text-lg lg:text-xl font-bold drop-shadow-sm">
                The En-Joy Speed crew
              </p>
              <p className="text-white/90 text-sm mt-1 max-w-xl drop-shadow-sm">
                Every morning, before the sun rises, the team is already prepping — bikes checked, route confirmed, energy ready.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Credentials grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {credentials.map((cred, i) => (
            <motion.div
              key={cred.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col items-center text-center p-5 rounded-xl bg-white border border-sand/40"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/8 border border-accent/10 flex items-center justify-center mb-3">
                <cred.icon className="h-5 w-5 text-accent" />
              </div>
              <p className="font-bold text-sm text-ink">{cred.label}</p>
              <p className="text-xs text-ink-muted mt-0.5">{cred.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
