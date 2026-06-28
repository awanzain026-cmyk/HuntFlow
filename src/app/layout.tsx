"use client";

import "./globals.css";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { AnimatePresence, motion } from "framer-motion";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <html lang="en">
      <head>
        <title>HuntFlow — AI Client Acquisition Agent</title>
        <meta name="description" content="Your AI agent that never stops hunting clients. Find, score, and manage leads automatically." />
      </head>
      <body className="flex">
        {!isLanding && <Sidebar />}
        <main className={`flex-1 min-h-screen ${!isLanding ? "ml-0 md:ml-64 pb-20 md:pb-0" : ""}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        {!isLanding && <MobileNav />}
      </body>
    </html>
  );
}
