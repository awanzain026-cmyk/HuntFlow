"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Crosshair,
  Search,
  Zap,
  MessageSquare,
  Mail,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Lead Research",
    desc: "Describe your ideal client and HuntFlow's AI finds 8 tailored leads instantly from Pakistani markets.",
  },
  {
    icon: Zap,
    title: "AI Scoring",
    desc: "Every lead is intelligently scored 0-100. Hot, Warm, or Cold — you know exactly who to prioritize.",
  },
  {
    icon: MessageSquare,
    title: "Personalized Outreach",
    desc: "Generate platform-specific messages (LinkedIn, Email, WhatsApp) that reference each lead's exact needs.",
  },
  {
    icon: Mail,
    title: "Gmail Drafts",
    desc: "Save and manage outreach drafts. Copy, regenerate, or store them for later sending.",
  },
];

const stats = [
  { value: "10x", label: "Faster Lead Research" },
  { value: "92%", label: "Relevance Accuracy" },
  { value: "500+", label: "Leads Scored" },
  { value: "40hrs", label: "Saved Per Month" },
];

export default function LandingPage() {
  const prefersReduced = useReducedMotion();
  const anim = (delay = 0) =>
    prefersReduced ? {} : { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.6 } };
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg accent-gradient flex items-center justify-center">
              <Crosshair className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">HuntFlow</span>
          </div>
          <Link
            href="/dashboard"
            className="cursor-pointer px-5 py-2 rounded-xl text-sm font-medium accent-gradient text-white hover:opacity-90 transition-all pulse-accent"
          >
            Launch Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div {...anim(0)}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#6C63FF]/10 border border-[#6C63FF]/20 text-sm text-[#6C63FF] mb-8">
              <Zap className="w-4 h-4" />
              AI-Powered Client Acquisition
            </div>
          </motion.div>

          <motion.h1 {...anim(0.1)}
            className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6"
          >
            Your AI Agent That{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C63FF] to-[#a855f7]">
              Never Stops Hunting
            </span>{" "}
            Clients
          </motion.h1>

          <motion.p {...anim(0.2)}
            className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            HuntFlow researches leads, scores them, writes personalized outreach
            and drafts emails — while you focus on doing the work.
          </motion.p>

          <motion.div {...anim(0.3)}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/dashboard"
            className="cursor-pointer inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold accent-gradient text-white hover:opacity-90 transition-all pulse-accent"
          >
            Launch Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
            <Link
              href="/briefing"
              className="cursor-pointer inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-medium glass text-gray-300 hover:text-white hover:border-[#6C63FF]/30 transition-all"
            >
              View Daily Briefing
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <motion.div key={s.label} {...anim(0.4 + i * 0.1)}
                className="glass rounded-2xl p-5 text-center"
              >
                <p className="text-2xl sm:text-3xl font-bold text-white">{s.value}</p>
                <p className="text-sm text-gray-400 mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            {...(!prefersReduced ? { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } } : {})}
            className="text-3xl sm:text-4xl font-bold text-white text-center mb-14"
          >
            Everything You Need to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C63FF] to-[#a855f7]">
              Close More Clients
            </span>
          </motion.h2>

          <div className="grid sm:grid-cols-2 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                {...(!prefersReduced ? { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { delay: i * 0.1 } } : {})}
                className="glass rounded-2xl p-6 hover:border-[#6C63FF]/20 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-[#6C63FF]/15 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-[#6C63FF]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <motion.div
          {...(!prefersReduced ? { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } } : {})}
          className="max-w-3xl mx-auto glass rounded-3xl p-10 sm:p-14 text-center border border-[#6C63FF]/10"
        >
          <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center mx-auto mb-6">
            <Crosshair className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to Automate Your Client Hunt?
          </h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Stop cold-DMing blindly. Let AI find, score, and write to your ideal
            clients. Start hunting in 30 seconds.
          </p>
          <Link
            href="/dashboard"
            className="cursor-pointer inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold accent-gradient text-white hover:opacity-90 transition-all"
          >
            Launch Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Crosshair className="w-4 h-4 text-[#6C63FF]" />
            HuntFlow — AI Client Acquisition Agent
          </div>
          <p className="text-xs text-gray-600">
            Built by Muhammad Zain &middot; Powered by Sodeom AI
          </p>
        </div>
      </footer>
    </div>
  );
}
