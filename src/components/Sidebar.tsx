"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Mail,
  Sun,
  Crosshair,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/outreach", label: "Outreach", icon: Mail },
  { href: "/briefing", label: "Briefing", icon: Sun },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 z-50 hidden md:flex flex-col glass border-r border-[#6C63FF]/10">
      <Link href="/" className="flex items-center gap-3 px-6 py-7 border-b border-white/5">
        <div className="w-10 h-10 rounded-xl accent-gradient flex items-center justify-center">
          <Crosshair className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">HuntFlow</h1>
          <p className="text-xs text-gray-500">AI Acquisition Agent</p>
        </div>
      </Link>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-[#6C63FF]/15 text-[#6C63FF] border border-[#6C63FF]/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-5 border-t border-white/5">
        <p className="text-xs text-gray-600">Built for Muhammad Zain</p>
        <p className="text-xs text-gray-600 mt-0.5">v1.0 — Sodeom AI</p>
      </div>
    </aside>
  );
}
