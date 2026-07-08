"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Trash2,
  Download,
  X,
  MapPin,
  Building2,
  Mail,
  Clock,
} from "lucide-react";
import type { Lead } from "@/lib/types";
import { fetchLeads, updateLeadRemote, deleteLeadRemote } from "@/lib/api-leads";
import { generateId, addActivity } from "@/lib/store";

const statuses: Lead["status"][] = ["New", "Contacted", "Replied", "Converted"];
const filters = ["All", "🔥 Hot", "⚡ Warm", "❄️ Cold"] as const;

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("All");
  const [selected, setSelected] = useState<Lead | null>(null);

  const refresh = useCallback(async () => {
    const all = await fetchLeads();
    setLeads(all.filter((l) => l.saved));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchesSearch =
        l.businessName.toLowerCase().includes(search.toLowerCase()) ||
        l.ownerName.toLowerCase().includes(search.toLowerCase()) ||
        l.location.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "All" || l.scoreLabel === filter;
      return matchesSearch && matchesFilter;
    });
  }, [leads, search, filter]);

  const handleStatusChange = async (id: string, status: Lead["status"]) => {
    const lead = leads.find((l) => l.id === id);
    const updates: Partial<Lead> = { status };
    if (status === "Contacted") updates.lastContacted = new Date().toISOString();
    await updateLeadRemote(id, updates);
    refresh();
    if (selected?.id === id) {
      setSelected((prev) => (prev ? { ...prev, ...updates } : null));
    }
    addActivity({
      id: generateId(),
      type: status === "Converted" ? "lead_converted" : "lead_contacted",
      message: `${status} lead: ${lead?.businessName ?? "Unknown"}`,
      timestamp: new Date().toISOString(),
    });
  };

  const handleDelete = async (id: string) => {
    await deleteLeadRemote(id);
    if (selected?.id === id) setSelected(null);
    refresh();
  };

  const escapeCsv = (val: string | number) => {
    const s = String(val);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const exportCsv = () => {
    const headers = ["Business", "Owner", "Location", "Type", "Size", "Score", "Status", "Email", "Pain Point"];
    const rows = leads.map((l) =>
      [l.businessName, l.ownerName, l.location, l.businessType, l.businessSize, l.score, l.status, l.email, escapeCsv(l.painPoint)].map(escapeCsv).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "huntflow-leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-[#6C63FF]" />
            Leads Database
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {leads.length} saved {leads.length === 1 ? "lead" : "leads"}
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium glass text-gray-300 hover:text-white hover:border-[#6C63FF]/20 transition-all"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </motion.div>

      {/* Search + Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 mb-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by business, owner, or location..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0a0a0f] border border-gray-800 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#6C63FF]/50 transition-all"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
               className={`cursor-pointer px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                filter === f
                  ? "bg-[#6C63FF]/15 text-[#6C63FF] border border-[#6C63FF]/20"
                  : "text-gray-400 border border-gray-800 hover:border-gray-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl overflow-hidden"
      >
        {filteredLeads.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No leads found</p>
            <p className="text-gray-600 text-sm mt-1">
              {search || filter !== "All"
                ? "Try a different search or filter"
                : "Save leads from the dashboard to see them here"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-gray-400">
                  <th className="text-left px-4 py-3 font-medium">Business</th>
                  <th className="text-left px-4 py-3 font-medium hide-mobile">Owner</th>
                  <th className="text-left px-4 py-3 font-medium hide-mobile">Location</th>
                  <th className="text-center px-4 py-3 font-medium">Score</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredLeads.map((lead, i) => (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.03 }}
                      className={`border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-all ${
                        selected?.id === lead.id ? "bg-[#6C63FF]/5" : ""
                      }`}
                      onClick={() => setSelected(lead)}
                    >
                      <td className="px-4 py-3.5">
                        <p className="text-white font-medium">{lead.businessName}</p>
                        <p className="text-xs text-gray-500 sm:hidden">{lead.ownerName} &middot; {lead.location}</p>
                      </td>
                      <td className="px-4 py-3.5 text-gray-300 hide-mobile">{lead.ownerName}</td>
                      <td className="px-4 py-3.5 text-gray-300 hide-mobile">{lead.location}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                            lead.scoreLabel === "🔥 Hot"
                              ? "bg-red-500/10 text-red-400"
                              : lead.scoreLabel === "⚡ Warm"
                              ? "bg-orange-500/10 text-orange-400"
                              : "bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {lead.score}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as Lead["status"])}
                          onClick={(e) => e.stopPropagation()}
                          className={`text-xs px-2 py-1 rounded-lg border appearance-none cursor-pointer bg-transparent focus:outline-none ${
                            lead.status === "New"
                              ? "text-blue-400 border-blue-500/20"
                              : lead.status === "Contacted"
                              ? "text-yellow-400 border-yellow-500/20"
                              : lead.status === "Replied"
                              ? "text-purple-400 border-purple-500/20"
                              : "text-green-400 border-green-500/20"
                          }`}
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s} className="bg-[#1a1a2e]">
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(lead.id);
                          }}
                          className="cursor-pointer p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Side Panel */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setSelected(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full sm:w-96 z-50 glass border-l border-[#6C63FF]/10 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">Lead Details</h2>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-white">{selected.businessName}</h3>
                    <p className="text-sm text-gray-400">{selected.ownerName}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                        selected.scoreLabel === "🔥 Hot"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : selected.scoreLabel === "⚡ Warm"
                          ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      {selected.scoreLabel} ({selected.score})
                    </span>
                    <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-800 text-gray-300">
                      {selected.status}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      {selected.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      {selected.businessType} &middot; {selected.businessSize}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Mail className="w-4 h-4 text-gray-500" />
                      {selected.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Clock className="w-4 h-4 text-gray-500" />
                      Found {new Date(selected.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-sm text-gray-300 italic">
                      &ldquo;{selected.painPoint}&rdquo;
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Status</label>
                    <select
                      value={selected.status}
                      onChange={(e) => handleStatusChange(selected.id, e.target.value as Lead["status"])}
                      className="w-full px-4 py-3 rounded-xl bg-[#0a0a0f] border border-gray-800 text-white text-sm focus:outline-none focus:border-[#6C63FF]/50"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s} className="bg-[#1a1a2e]">
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleDelete(selected.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Lead
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
