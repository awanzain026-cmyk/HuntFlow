"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
  Database,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import KpiCard from "@/components/KpiCard";
import LeadCard from "@/components/LeadCard";
import { LeadCardSkeleton } from "@/components/Skeleton";
import { generateLeads } from "@/lib/ai";
import type { Lead, Activity } from "@/lib/types";
import {
  getLeads,
  addLead,
  updateLead,
  addActivity,
  getActivities,
  generateId,
  storeDemoData,
} from "@/lib/store";
import { demoLeads } from "@/lib/demoData";

export default function DashboardPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [idealClient, setIdealClient] = useState("");
  const [service, setService] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedLeads, setGeneratedLeads] = useState<Lead[]>([]);
  const [error, setError] = useState("");

  const refreshData = useCallback(() => {
    setLeads(getLeads());
    setActivities(getActivities().slice(0, 5));
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const savedLeads = leads.filter((l) => l.saved);
  const hotLeads = savedLeads.filter((l) => l.score >= 80);
  const responseRate = savedLeads.length > 0
    ? Math.round((savedLeads.filter((l) => l.status === "Replied" || l.status === "Converted").length / savedLeads.length) * 100)
    : 0;

  // Chart data
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

  const handleHunt = async () => {
    if (!idealClient.trim() || !service.trim()) {
      setError("Please fill in both fields");
      return;
    }
    setError("");
    setLoading(true);
    setGeneratedLeads([]);
    try {
      const raw = await generateLeads(idealClient.trim(), service.trim());
      console.log("[Dashboard] Raw AI response:", raw.slice(0, 500));

      // Extract JSON from markdown fences and clean up
      const cleaned = raw
        .replace(/```json|```JSON|```/g, "")
        .trim();
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error("[Dashboard] No JSON array found in response:", cleaned.slice(0, 300));
        throw new Error("AI response did not contain valid lead data. Raw: " + cleaned.slice(0, 200));
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed: any[] = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("AI returned empty or invalid lead array");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scored: Lead[] = parsed.map((p: any) => {
        const score = typeof p.score === "number" ? p.score : 50;
        const label: Lead["scoreLabel"] =
          score >= 80 ? "🔥 Hot" : score >= 50 ? "⚡ Warm" : "❄️ Cold";
        return {
          id: generateId(),
          businessName: p.businessName || "Unknown Business",
          ownerName: p.ownerName || "Unknown Owner",
          businessType: p.businessType || "General",
          location: p.location || "Pakistan",
          businessSize: (p.businessSize === "Small" || p.businessSize === "Medium") ? p.businessSize : "Small",
          painPoint: p.painPoint || "Needs digital solutions",
          email: p.email || "contact@example.com",
          score,
          scoreLabel: label,
          status: "New",
          createdAt: new Date().toISOString(),
          saved: false,
        };
      });
      console.log("[Dashboard] Parsed leads:", scored.length);
      setGeneratedLeads(scored);

      addActivity({
        id: generateId(),
        type: "lead_found",
        message: `AI found ${scored.length} leads for "${service}"`,
        timestamp: new Date().toISOString(),
      });
      setActivities(getActivities().slice(0, 5));
    } catch (e) {
      console.error("[Dashboard] AI generation error:", e);
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError("Failed to generate leads: " + msg.slice(0, 200));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (lead: Lead) => {
    const updated = { ...lead, saved: !lead.saved };
    if (!lead.saved) {
      addLead(updated);
    } else {
      updateLead(lead.id, { saved: false });
    }
    setGeneratedLeads((prev) => prev.map((l) => (l.id === lead.id ? updated : l)));
    refreshData();

    addActivity({
      id: generateId(),
      type: "lead_saved",
      message: `${lead.saved ? "Removed" : "Saved"} lead: ${lead.businessName}`,
      timestamp: new Date().toISOString(),
    });
    setActivities(getActivities().slice(0, 5));
  };

  const handleOutreach = (lead: Lead) => {
    // Save lead first, then navigate
    if (!lead.saved) {
      addLead({ ...lead, saved: true });
      refreshData();
    }
    // Store selected lead in localStorage for outreach page
    localStorage.setItem("huntflow_selected_lead", lead.id);
    router.push("/outreach");
  };

  const loadDemoData = () => {
    storeDemoData(demoLeads);
    setGeneratedLeads([]);
    refreshData();

    addActivity({
      id: generateId(),
      type: "lead_found",
      message: "Loaded 6 demo leads to showcase the system",
      timestamp: new Date().toISOString(),
    });
    setActivities(getActivities().slice(0, 5));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Crosshair className="w-7 h-7 text-[#6C63FF]" />
            Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Your AI-powered client acquisition command center
          </p>
        </div>
        <button
          onClick={loadDemoData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium glass text-gray-300 hover:text-white hover:border-[#6C63FF]/20 transition-all"
        >
          <Database className="w-4 h-4" />
          Load Demo Data
        </button>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Total Leads Found"
          value={savedLeads.length}
          icon={<Users className="w-5 h-5" />}
          trend="up"
          trendValue="+12 this week"
          delay={0}
        />
        <KpiCard
          title="Hot Leads"
          value={hotLeads.length}
          icon={<Flame className="w-5 h-5" />}
          trend={hotLeads.length > 0 ? "up" : "down"}
          trendValue={`${hotLeads.length} ready to contact`}
          delay={0.1}
        />
        <KpiCard
          title="Leads Saved"
          value={savedLeads.length}
          icon={<FileText className="w-5 h-5" />}
          trend="up"
          trendValue="All saved leads"
          delay={0.2}
        />
        <KpiCard
          title="Response Rate"
          value={`${responseRate}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={responseRate > 30 ? "up" : "down"}
          trendValue={responseRate > 30 ? "On track" : "Needs work"}
          delay={0.3}
        />
      </div>

      {/* Lead Research Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-6 mb-8"
      >
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

        {error && (
          <p className="text-red-400 text-sm mb-3">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleHunt}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium accent-gradient text-white hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Crosshair className="w-4 h-4" />
            )}
            {loading ? "Hunting..." : "Hunt Leads"}
          </button>
          <p className="text-xs text-gray-500">
            AI generates 8 tailored leads from Pakistani markets
          </p>
        </div>
      </motion.div>

      {/* Generated Leads */}
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <LeadCardSkeleton key={i} />
          ))}
        </div>
      )}

      {generatedLeads.length > 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#6C63FF]" />
            Generated Leads ({generatedLeads.length})
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedLeads.map((lead, i) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onSave={handleSave}
                onOutreach={handleOutreach}
                index={i}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Bottom Grid: Activity + Chart */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#6C63FF]" />
            Recent Activity
          </h3>
          {activities.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No activity yet. Hunt some leads to get started!
            </p>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/5"
                >
                  <div className="w-2 h-2 rounded-full bg-[#6C63FF] mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-300">{act.message}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(act.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#6C63FF]" />
            Leads Found (Last 7 Days)
          </h3>
          {chartData.every((d) => d.leads === 0) ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No leads found yet. Start hunting to see chart data.
            </p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#1a1a2e",
                      border: "1px solid rgba(108,99,255,0.2)",
                      borderRadius: "12px",
                      color: "#e2e8f0",
                    }}
                  />
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
