import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Admin Portal | Ruqayya Medical Center",
  description: "Executive and administrative operations portal for Ruqayya Medical Center",
};

export const viewport: Viewport = {
  themeColor: "#9333ea",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
