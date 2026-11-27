const CACHE_PREFIX = "rmc-hms-offline-";
const CACHE_NAME = CACHE_PREFIX + "v1";
const OFFLINE_URL = "/offline.html";
const LEGACY_ADMIN_CACHE = "rmc-admin-v1";

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.add(new Request(new URL(OFFLINE_URL, self.location.origin), {
      cache: "reload",
      credentials: "omit",
      redirect: "error",
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) =>
          key === LEGACY_ADMIN_CACHE ||
          (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        )
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.mode !== "navigate") return;

  const url = new URL(request.url);
  if (
    url.origin !== self.location.origin ||
    url.pathname === "/api" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/")
  ) return;

  // Leave authenticated responses to the network. Only the public offline screen is cached.
  event.respondWith(fetch(request).catch(async () => {
    const offline = await caches.match(OFFLINE_URL, { cacheName: CACHE_NAME });
    return offline ?? new Response("HMS is offline. Reconnect and try again.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }));
});
