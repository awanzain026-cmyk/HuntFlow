"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  MessageSquare,
  Copy,
  Check,
  Save,
  RotateCw,
  Loader2,
  Sparkles,
  Trash2,
  MessageCircle,
} from "lucide-react";
import { generateOutreach } from "@/lib/ai";
import type { Lead, Draft } from "@/lib/types";
import { getLeads, getDrafts, addDraft, deleteDraft, generateId, addActivity } from "@/lib/store";

const platforms = ["LinkedIn DM", "Email", "WhatsApp"] as const;

export default function OutreachPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [platform, setPlatform] = useState<"LinkedIn DM" | "Email" | "WhatsApp">("LinkedIn DM");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const refresh = useCallback(() => {
    setLeads(getLeads().filter((l) => l.saved));
    setDrafts(getDrafts());
  }, []);

  useEffect(() => {
    refresh();
    // Check if a lead was pre-selected from dashboard
    const preselected = localStorage.getItem("huntflow_selected_lead");
    if (preselected) {
      setSelectedLeadId(preselected);
      localStorage.removeItem("huntflow_selected_lead");
    }
  }, [refresh]);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  const handleGenerate = async () => {
    if (!selectedLead) return;
    setLoading(true);
    setMessage("");
    setCopied(false);
    setSaved(false);
    try {
      const result = await generateOutreach(
        selectedLead.businessName,
        selectedLead.businessName,
        selectedLead.painPoint,
        platform,
        selectedLead.ownerName
      );
      setMessage(result);
    } catch (e) {
      console.error("[Outreach] Generation error:", e);
      const msg = e instanceof Error ? e.message : "Unknown error";
      setMessage("Failed to generate message: " + msg.slice(0, 200));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveDraft = () => {
    if (!selectedLead || !message) return;
    const draft: Draft = {
      id: generateId(),
      leadId: selectedLead.id,
      leadName: selectedLead.ownerName,
      businessName: selectedLead.businessName,
      platform,
      content: message,
      createdAt: new Date().toISOString(),
    };
    addDraft(draft);
    setSaved(true);
    setDrafts(getDrafts());
    addActivity({
      id: generateId(),
      type: "message_generated",
      message: `Saved ${platform} draft for ${selectedLead.businessName}`,
      timestamp: new Date().toISOString(),
    });
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDeleteDraft = (id: string) => {
    deleteDraft(id);
    setDrafts(getDrafts());
  };

  const platformIcon = (p: string) => {
    switch (p) {
      case "LinkedIn DM": return <MessageSquare className="w-4 h-4" />;
      case "WhatsApp": return <MessageCircle className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const platformColor = (p: string) => {
    switch (p) {
      case "LinkedIn DM": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "WhatsApp": return "text-green-400 bg-green-500/10 border-green-500/20";
      default: return "text-purple-400 bg-purple-500/10 border-purple-500/20";
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Mail className="w-7 h-7 text-[#6C63FF]" />
          Outreach Writer
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          AI-generated personalized messages for every lead
        </p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 mb-6"
      >
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Select Lead</label>
            <select
              value={selectedLeadId}
              onChange={(e) => {
                setSelectedLeadId(e.target.value);
                setMessage("");
                setCopied(false);
              }}
              className="w-full px-4 py-3 rounded-xl bg-[#0a0a0f] border border-gray-800 text-white text-sm focus:outline-none focus:border-[#6C63FF]/50"
            >
              <option value="" className="bg-[#1a1a2e]">Choose a saved lead...</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id} className="bg-[#1a1a2e]">
                  {l.businessName} — {l.ownerName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Platform</label>
            <div className="flex gap-1.5">
              {platforms.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-xs font-medium transition-all ${
                    platform === p
                      ? "bg-[#6C63FF]/15 text-[#6C63FF] border border-[#6C63FF]/20"
                      : "bg-[#0a0a0f] text-gray-400 border border-gray-800 hover:border-gray-700"
                  }`}
                >
                  {platformIcon(p)}
                  {p === "LinkedIn DM" ? "LinkedIn" : p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={!selectedLead || loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium accent-gradient text-white hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {loading ? "Generating..." : "Generate Message"}
            </button>
          </div>
        </div>

        {selectedLead && (
          <div className="flex flex-wrap gap-2 text-xs text-gray-400">
            <span>Target: {selectedLead.businessName}</span>
            <span>&middot;</span>
            <span>Need: {selectedLead.painPoint.slice(0, 60)}...</span>
          </div>
        )}
      </motion.div>

      {/* Loading */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-8 mb-6 flex flex-col items-center justify-center gap-3"
        >
          <Loader2 className="w-8 h-8 text-[#6C63FF] animate-spin" />
          <p className="text-sm text-gray-400">Crafting personalized message...</p>
          <div className="w-48 h-1.5 rounded-full bg-[#0a0a0f] overflow-hidden">
            <div className="h-full w-1/3 rounded-full accent-gradient animate-pulse" />
          </div>
        </motion.div>
      )}

      {/* Message Output */}
      {message && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Generated {platform}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${platformColor(platform)}`}>
                {platform}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium glass text-gray-300 hover:text-white transition-all"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={handleSaveDraft}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium glass text-gray-300 hover:text-white transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                {saved ? "Saved!" : "Save Draft"}
              </button>
              <button
                onClick={handleGenerate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium glass text-gray-300 hover:text-white transition-all"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Regenerate
              </button>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[#0a0a0f] border border-white/5">
            <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{message}</p>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Word count: {message.split(/\s+/).filter(Boolean).length} words
          </p>
        </motion.div>
      )}

      {/* Saved Drafts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#6C63FF]" />
          Saved Drafts ({drafts.length})
        </h3>

        {drafts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No saved drafts yet. Generate and save a message above.
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#6C63FF]/10 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm font-medium text-white">{draft.businessName}</p>
                    <p className="text-xs text-gray-400">{draft.leadName}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${platformColor(draft.platform)}`}>
                      {draft.platform}
                    </span>
                    <button
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">{draft.content}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(draft.createdAt).toLocaleDateString()} &middot;{" "}
                  {draft.content.split(/\s+/).filter(Boolean).length} words
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
