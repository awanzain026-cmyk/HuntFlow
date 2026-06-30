"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Mail, Sun } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/outreach", label: "Outreach", icon: Mail },
  { href: "/briefing", label: "Briefing", icon: Sun },
];

export default function MobileNav() {
  const path = usePathname();

  return (
    <nav className="show-mobile fixed bottom-0 left-0 right-0 z-50 glass border-t border-[#6C63FF]/10 safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={`cursor-pointer flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                active ? "text-[#6C63FF]" : "text-gray-500"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
