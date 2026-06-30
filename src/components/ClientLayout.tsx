"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const prefersReduced = useReducedMotion();

  return (
    <div className="flex">
      {!isLanding && <Sidebar />}
      <main
        className={`flex-1 min-h-screen ${
          !isLanding ? "ml-0 md:ml-64 pb-20 md:pb-0" : ""
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={
              prefersReduced ? {} : { opacity: 0, y: 10 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? {} : { opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      {!isLanding && <MobileNav />}
    </div>
  );
}
