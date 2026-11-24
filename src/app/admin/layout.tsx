import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Admin Portal | Ruqayya Medical Center",
  description: "Executive and administrative operations portal for Ruqayya Medical Center",
  manifest: "/admin-manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RMC Admin",
  },
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
  return (
    <>
      {children}
      {/* Client-side Service Worker Registration for Admin PWA */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator && window.location.pathname.startsWith('/admin')) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js', { scope: '/admin' })
                  .then(function(reg) {
                    console.log('[RMC PWA] Admin Service Worker registered with scope:', reg.scope);
                  })
                  .catch(function(err) {
                    console.error('[RMC PWA] Service Worker registration failed:', err);
                  });
              });
            }
          `,
        }}
      />
    </>
  );
}
