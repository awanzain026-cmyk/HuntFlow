"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Sun,
  Users,
  Clock,
  FileText,
  RefreshCw,
  Loader2,
  Lightbulb,
  TrendingUp,
  CheckCircle2,
  MessageCircle,
  MessageSquare,
  Mail,
  Sparkles,
} from "lucide-react";
import type { BriefingData } from "@/lib/types";
import { getLeads, getDrafts } from "@/lib/store";
import { generateTip } from "@/lib/ai";

export default function BriefingPage() {
  const [data, setData] = useState<BriefingData>({
    totalLeads: 0,
    needsFollowUp: 0,
    draftsWaiting: 0,
    tipOfDay: "",
    bestPlatform: "LinkedIn DM",
  });
  const [tipLoading, setTipLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const calculateData = useCallback(() => {
    const leads = getLeads().filter((l) => l.saved);
    const drafts = getDrafts();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const needsFollowUp = leads.filter(
      (l) =>
        l.status === "Contacted" &&
        l.lastContacted &&
        new Date(l.lastContacted) < threeDaysAgo
    ).length;

    // Determine best platform from drafts
    const platformCounts: Record<string, number> = {};
    drafts.forEach((d) => {
      platformCounts[d.platform] = (platformCounts[d.platform] || 0) + 1;
    });
    const bestPlatform =
      Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "LinkedIn DM";

    setData((prev) => ({
      totalLeads: leads.length,
      needsFollowUp,
      draftsWaiting: drafts.length,
      tipOfDay: prev.tipOfDay,
      bestPlatform,
    }));
  }, []);

  const loadTip = useCallback(async () => {
    setTipLoading(true);
    try {
      const tip = await generateTip();
      setData((prev) => ({ ...prev, tipOfDay: tip }));
    } catch (e) {
      console.error("Tip generation error:", e);
      setData((prev) => ({
        ...prev,
        tipOfDay: "Focus on solving one specific pain point per lead. Personalized outreach converts 3x better than generic templates.",
      }));
    } finally {
      setTipLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    calculateData();
    await loadTip();
    setRefreshing(false);
  }, [calculateData, loadTip]);

  useEffect(() => {
    calculateData();
    loadTip();
  }, [calculateData, loadTip]);

  const cards = [
    {
      icon: Users,
      label: "Total Leads Saved",
      value: data.totalLeads,
      color: "text-blue-400 bg-blue-500/10",
      delay: 0,
    },
    {
      icon: Clock,
      label: "Needs Follow-Up",
      value: data.needsFollowUp,
      color: "text-yellow-400 bg-yellow-500/10",
      delay: 0.1,
    },
    {
      icon: FileText,
      label: "Drafts Waiting",
      value: data.draftsWaiting,
      color: "text-purple-400 bg-purple-500/10",
      delay: 0.2,
    },
    {
      icon: TrendingUp,
      label: "Best Platform",
      value: data.bestPlatform,
      color: "text-green-400 bg-green-500/10",
      delay: 0.3,
    },
  ];

  const platformIcon = (p: string) => {
    switch (p) {
      case "LinkedIn DM": return <MessageSquare className="w-4 h-4" />;
      case "WhatsApp": return <MessageCircle className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Sun className="w-7 h-7 text-[#6C63FF]" />
            Morning Briefing
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={refreshAll}
          disabled={refreshing}
          className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium glass text-gray-300 hover:text-white hover:border-[#6C63FF]/20 disabled:opacity-50 transition-all"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh Briefing
        </button>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: card.delay, duration: 0.4 }}
            className="glass rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">
              {typeof card.value === "number" ? card.value : (
                <span className="flex items-center gap-1.5 text-base">
                  {platformIcon(card.value)}
                  {card.value}
                </span>
              )}
            </p>
            <p className="text-sm text-gray-400 mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tip of the Day */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-2xl p-6 mb-6 border border-[#6C63FF]/10"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#6C63FF]/15 flex items-center justify-center shrink-0">
            {tipLoading ? (
              <Loader2 className="w-6 h-6 text-[#6C63FF] animate-spin" />
            ) : (
              <Lightbulb className="w-6 h-6 text-[#6C63FF]" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white mb-1">AI Freelancing Tip of the Day</h3>
            {tipLoading ? (
              <div className="space-y-2 mt-2">
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-3/4" />
              </div>
            ) : (
              <p className="text-sm text-gray-300 leading-relaxed">
                {data.tipOfDay || "Loading tip..."}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Action Items */}
      <div className="grid sm:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            Today&apos;s Priorities
          </h3>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2.5 text-sm text-gray-300">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
              {data.needsFollowUp > 0
                ? `Follow up with ${data.needsFollowUp} lead${data.needsFollowUp > 1 ? "s" : ""} who haven't replied`
                : "All leads are up to date — great work!"}
            </li>
            <li className="flex items-start gap-2.5 text-sm text-gray-300">
              <div className="w-1.5 h-1.5 rounded-full bg-[#6C63FF] mt-1.5 shrink-0" />
              {data.draftsWaiting > 0
                ? `Send ${data.draftsWaiting} draft${data.draftsWaiting > 1 ? "s" : ""} waiting in your outreach queue`
                : "Generate new outreach drafts from the Outreach page"}
            </li>
            <li className="flex items-start gap-2.5 text-sm text-gray-300">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
              {data.totalLeads > 0
                ? `${data.totalLeads} leads in your pipeline — keep the momentum going`
                : "Hunt for new leads from the Dashboard"}
            </li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#6C63FF]" />
            Quick Actions
          </h3>
          <div className="space-y-2.5">
            <a
              href="/dashboard"
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-sm text-gray-300"
            >
              <Users className="w-4 h-4 text-[#6C63FF]" />
              Hunt for new leads
            </a>
            <a
              href="/outreach"
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-sm text-gray-300"
            >
              <FileText className="w-4 h-4 text-[#6C63FF]" />
              Write outreach messages
            </a>
            <a
              href="/leads"
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-sm text-gray-300"
            >
              <CheckCircle2 className="w-4 h-4 text-[#6C63FF]" />
              Review and update lead statuses
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
