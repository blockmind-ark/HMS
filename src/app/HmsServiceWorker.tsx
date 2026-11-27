"use client";

import { useEffect } from "react";

export function HmsServiceWorker() {
  useEffect(() => {
    if (!window.isSecureContext || !("serviceWorker" in navigator)) return;

    const workerUrl = new URL("/sw.js", window.location.origin).href;
    const legacyScopes = new Set([
      new URL("/admin", window.location.origin).href,
      new URL("/admin/", window.location.origin).href,
    ]);
    const serviceWorkers = navigator.serviceWorker;

    async function register() {
      await serviceWorkers.register(workerUrl, { scope: "/", updateViaCache: "none" });
      const registrations = await serviceWorkers.getRegistrations();

      await Promise.all(
        registrations
          .filter((registration) =>
            legacyScopes.has(registration.scope) &&
            [registration.active, registration.waiting, registration.installing]
              .some((worker) => worker?.scriptURL === workerUrl)
          )
          .map((registration) => registration.unregister())
      );
    }

    void register().catch((error) => {
      console.warn("HMS service worker could not be configured:", error);
    });
  }, []);

  return null;
}
