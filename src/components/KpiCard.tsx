"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: "up" | "down";
  trendValue?: string;
  delay?: number;
}

export default function KpiCard({ title, value, icon, trend, trendValue, delay = 0 }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass rounded-2xl p-5 hover:border-[#6C63FF]/20 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 text-xs">
              {trend === "up" ? (
                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              )}
              <span className={trend === "up" ? "text-green-400" : "text-red-400"}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#6C63FF]/15 flex items-center justify-center text-[#6C63FF]">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
