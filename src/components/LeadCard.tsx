"use client";

import type { Lead } from "@/lib/types";
import { MapPin, Building2, Users, Mail, Sparkles, BookmarkPlus, BookmarkCheck } from "lucide-react";
import { motion } from "framer-motion";

interface LeadCardProps {
  lead: Lead;
  onSave?: (lead: Lead) => void;
  onOutreach?: (lead: Lead) => void;
  index?: number;
}

export default function LeadCard({ lead, onSave, onOutreach, index = 0 }: LeadCardProps) {
  const glowClass =
    lead.scoreLabel === "🔥 Hot"
      ? "glow-hot"
      : lead.scoreLabel === "⚡ Warm"
      ? "glow-warm"
      : "glow-cold";

  const scoreColor =
    lead.scoreLabel === "🔥 Hot"
      ? "text-red-400"
      : lead.scoreLabel === "⚡ Warm"
      ? "text-orange-400"
      : "text-blue-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className={`glass rounded-2xl p-5 ${glowClass} hover:bg-[#1a1a2e]/90 transition-all`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{lead.businessName}</h3>
          <p className="text-sm text-gray-400">{lead.ownerName}</p>
        </div>
        <div className={`text-right ${scoreColor}`}>
          <p className="text-2xl font-bold">{lead.score}</p>
          <p className="text-xs font-medium">{lead.scoreLabel}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-3 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {lead.location}
        </span>
        <span className="flex items-center gap-1">
          <Building2 className="w-3 h-3" /> {lead.businessType}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" /> {lead.businessSize}
        </span>
        <span className="flex items-center gap-1">
          <Mail className="w-3 h-3" /> {lead.email}
        </span>
      </div>

      <p className="text-sm text-gray-300 mb-4 italic">
        &ldquo;{lead.painPoint}&rdquo;
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => onOutreach?.(lead)}
          className="cursor-pointer flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium accent-gradient text-white hover:opacity-90 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Write Outreach
        </button>
        <button
          onClick={() => onSave?.(lead)}
          className={`cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
            lead.saved
              ? "border-[#6C63FF]/30 text-[#6C63FF] bg-[#6C63FF]/10"
              : "border-gray-700 text-gray-300 hover:border-[#6C63FF]/30 hover:text-[#6C63FF]"
          }`}
        >
          {lead.saved ? (
            <BookmarkCheck className="w-4 h-4" />
          ) : (
            <BookmarkPlus className="w-4 h-4" />
          )}
          {lead.saved ? "Saved" : "Save"}
        </button>
      </div>
    </motion.div>
  );
}
