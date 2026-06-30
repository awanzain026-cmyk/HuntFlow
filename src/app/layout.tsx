import "./globals.css";
import type { Metadata } from "next";
import ClientLayout from "@/components/ClientLayout";

export const metadata: Metadata = {
  title: "HuntFlow — AI Client Acquisition Agent",
  description:
    "Your AI agent that never stops hunting clients. Find, score, and manage leads automatically with HuntFlow.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
