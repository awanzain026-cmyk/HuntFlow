"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Users,
  Flame,
  FileText,
  TrendingUp,
  Search,
  Crosshair,
  Clock,
  BarChart3,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import KpiCard from "@/components/KpiCard";
import LeadCard from "@/components/LeadCard";
import { LeadCardSkeleton } from "@/components/Skeleton";
import { enrichSearchResults } from "@/lib/ai";
import type { Lead, Activity } from "@/lib/types";
import {
  getLeads,
  addLead,
  updateLead,
  addActivity,
  getActivities,
  generateId,
  clearAllLeads,
} from "@/lib/store";

export default function DashboardPage() {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const clearTimer = useRef<ReturnType<typeof setTimeout>>();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [idealClient, setIdealClient] = useState("");
  const [service, setService] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedLeads, setGeneratedLeads] = useState<Lead[]>([]);
  const [error, setError] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const refreshData = useCallback(() => {
    setLeads(getLeads());
    setActivities(getActivities().slice(0, 5));
  }, []);

  useEffect(() => {
    refreshData();
    return () => clearTimer.current && clearTimeout(clearTimer.current);
  }, [refreshData]);

  const totalLeads = leads.length;
  const savedLeads = leads.filter((l) => l.saved);
  const hotLeads = savedLeads.filter((l) => l.score >= 80);
  const responseRate = savedLeads.length > 0
    ? Math.round((savedLeads.filter((l) => l.status === "Replied" || l.status === "Converted").length / savedLeads.length) * 100)
    : 0;
  const hotTrend = hotLeads.length > 0 ? "up" : "down";

  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const day = d.toLocaleDateString("en-US", { weekday: "short" });
    const count = leads.filter((l) => {
      const created = new Date(l.createdAt);
      return created.toDateString() === d.toDateString();
    }).length;
    return { day, leads: count };
  });

  const anim = (delay = 0) =>
    prefersReduced ? {} : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.4 } };

  const handleHunt = async () => {
    if (!idealClient.trim() || !service.trim()) {
      setError("Please fill in both fields");
      return;
    }
    setError("");
    setLoading(true);
    setGeneratedLeads([]);
    try {
      // Step 1: Search Google for real businesses via Serper
      const queryTerms = [
        idealClient.trim(),
        service.trim(),
        "Pakistan company",
      ];
      const excludes = [
        "-paper", "-study", "-research", "-journal", "-thesis",
        "-dissertation", "-pdf", "-analysis", "-review",
      ];
      const searchQuery = [...queryTerms, ...excludes].join(" ");
      console.log("[Dashboard] Searching for:", searchQuery);

      const searchRes = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, num: 10 }),
      });

      if (!searchRes.ok) {
        const errData = await searchRes.json().catch(() => ({}));
        throw new Error(errData.error || `Search failed (${searchRes.status})`);
      }

      const searchData = await searchRes.json();
      const realResults = searchData.results || [];

      if (realResults.length === 0) {
        throw new Error("No real businesses found. Try a different search query.");
      }

      console.log("[Dashboard] Found", realResults.length, "real results from Google");

      // Step 2: Enrich search results with AI
      const raw = await enrichSearchResults(realResults, service.trim(), idealClient.trim());
      const cleaned = raw.replace(/```json|```JSON|```/g, "").trim();
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("AI enrichment failed.");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed: any[] = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("AI returned empty leads");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scored: Lead[] = parsed.map((p: any) => ({
        id: generateId(),
        businessName: p.businessName || "Unknown Business",
        ownerName: p.ownerName || "Contact via Website",
        businessType: p.businessType || "General",
        location: p.location || "Pakistan",
        businessSize: (p.businessSize === "Small" || p.businessSize === "Medium") ? p.businessSize : "Small",
        painPoint: p.painPoint || "Potential client",
        email: p.email || "",
        website: p.website || "",
        snippet: p.snippet || "",
        score: typeof p.score === "number" ? p.score : 50,
        scoreLabel: (p.score ?? 50) >= 80 ? "🔥 Hot" : (p.score ?? 50) >= 50 ? "⚡ Warm" : "❄️ Cold",
        status: "New",
        createdAt: new Date().toISOString(),
        saved: false,
      }));
      setGeneratedLeads(scored);
      addActivity({
        id: generateId(),
        type: "lead_found",
        message: `Found ${scored.length} real leads from Google search for "${service}"`,
        timestamp: new Date().toISOString(),
      });
      setActivities(getActivities().slice(0, 5));
    } catch (e) {
      console.error("[Dashboard] Hunt error:", e);
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg.slice(0, 300));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (lead: Lead) => {
    const willSave = !lead.saved;
    const updated = { ...lead, saved: willSave };
    if (willSave) {
      addLead(updated);
    } else {
      updateLead(lead.id, { saved: false });
    }
    setGeneratedLeads((prev) => prev.map((l) => (l.id === lead.id ? updated : l)));
    refreshData();
    addActivity({
      id: generateId(),
      type: willSave ? "lead_saved" : "lead_unsaved",
      message: `${willSave ? "Saved" : "Removed"} lead: ${lead.businessName}`,
      timestamp: new Date().toISOString(),
    });
    setActivities(getActivities().slice(0, 5));
  };

  const handleOutreach = (lead: Lead) => {
    if (!lead.saved) {
      addLead({ ...lead, saved: true });
      refreshData();
    }
    localStorage.setItem("huntflow_selected_lead", lead.id);
    router.push("/outreach");
  };

  const handleClearAll = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      clearTimer.current = setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearAllLeads();
    setGeneratedLeads([]);
    setConfirmClear(false);
    refreshData();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div {...anim(0)} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Crosshair className="w-7 h-7 text-[#6C63FF]" />
            Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">Your AI-powered client acquisition command center</p>
        </div>
        <button
          onClick={handleClearAll}
          className={`cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            confirmClear
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : "glass text-gray-300 hover:text-red-400 hover:border-red-500/20"
          }`}
        >
          <Trash2 className="w-4 h-4" />
          {confirmClear ? "Sure? Click again" : "Clear All"}
        </button>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard title="Total Leads Found" value={totalLeads} icon={<Users className="w-5 h-5" />} delay={0} />
        <KpiCard title="Hot Leads" value={hotLeads.length} icon={<Flame className="w-5 h-5" />} trend={hotTrend} trendValue={`${hotLeads.length} ready to contact`} delay={0.1} />
        <KpiCard title="Leads Saved" value={savedLeads.length} icon={<FileText className="w-5 h-5" />} delay={0.2} />
        <KpiCard title="Response Rate" value={`${responseRate}%`} icon={<TrendingUp className="w-5 h-5" />} trend={responseRate > 30 ? "up" : "down"} trendValue={responseRate > 30 ? "On track" : "Needs work"} delay={0.3} />
      </div>

      <motion.div {...anim(0.2)} className="glass rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-[#6C63FF]" />
          Lead Research Panel
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Describe your ideal client</label>
            <input
              type="text"
              value={idealClient}
              onChange={(e) => setIdealClient(e.target.value)}
              placeholder="Pakistani small businesses needing financial dashboards"
              className="w-full px-4 py-3 rounded-xl bg-[#0a0a0f] border border-gray-800 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#6C63FF]/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Your service</label>
            <input
              type="text"
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="AI Financial Dashboard Developer"
              className="w-full px-4 py-3 rounded-xl bg-[#0a0a0f] border border-gray-800 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#6C63FF]/50 transition-all"
            />
          </div>
        </div>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <div className="flex items-center gap-3">
          <button
            onClick={handleHunt}
            disabled={loading}
            className="cursor-pointer flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium accent-gradient text-white hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
            {loading ? "Hunting..." : "Hunt Leads"}
          </button>
          <p className="text-xs text-gray-500">Searches Google for real businesses, then enriches with AI</p>
        </div>
      </motion.div>

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <LeadCardSkeleton key={i} />
          ))}
        </div>
      )}

      {generatedLeads.length > 0 && !loading && (
        <motion.div {...anim(0)} className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#6C63FF]" />
            Generated Leads ({generatedLeads.length})
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedLeads.map((lead, i) => (
              <LeadCard key={lead.id} lead={lead} onSave={handleSave} onOutreach={handleOutreach} index={i} />
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div {...anim(0.3)} className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#6C63FF]" />
            Recent Activity
          </h3>
          {activities.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No activity yet. Hunt some leads to get started!</p>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                  <div className="w-2 h-2 rounded-full bg-[#6C63FF] mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-300">{act.message}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(act.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div {...anim(0.4)} className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#6C63FF]" />
            Leads Found (Last 7 Days)
          </h3>
          {chartData.every((d) => d.leads === 0) ? (
            <p className="text-sm text-gray-500 text-center py-8">No leads found yet. Start hunting to see chart data.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(108,99,255,0.2)", borderRadius: "12px", color: "#e2e8f0" }} />
                  <Bar dataKey="leads" fill="#6C63FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
