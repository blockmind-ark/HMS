import type { Metadata, Viewport } from "next";
import "./globals.css";
import { HmsServiceWorker } from "./HmsServiceWorker";
import { SessionProvider } from "@/components/providers/SessionProvider";

export const metadata: Metadata = {
  title: "Ruqayya Medical Center & Pharmacy Management System",
  description: "Ruqayya Medical Center - Unified clinical operations, diagnostic imaging, and pharmacy POS platform.",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "RMC HMS" },
  icons: { apple: "/icons/admin-icon-192.png" },
};

export const viewport: Viewport = { themeColor: "#0f172a" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <HmsServiceWorker />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
