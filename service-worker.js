// ========================================
// AmorFati — Service Worker
// ========================================
// Strategy: network-first for HTML, cache-first for assets.
// Precaches only the app shell; other assets are cached on first visit.

const CACHE_NAME = "amor-fati-cache-v5";

const PRECACHE_ASSETS = ["./", "./manifest.json", "./offline.html"];

// Installation : precache the app shell
self.addEventListener("install", (event) => {
  console.log("[SW] Installation...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Mise en cache du shell");
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log("[SW] Installation terminée");
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error("[SW] Erreur installation:", err);
      }),
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activation...");
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              console.log("[SW] Suppression ancien cache:", key);
              return caches.delete(key);
            }
            return Promise.resolve();
          }),
        ),
      )
      .then(() => {
        console.log("[SW] Activation terminée");
        return self.clients.claim();
      }),
  );
});

// Helper: envoyer message à tous les clients
function broadcastMessage(msg) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => client.postMessage(msg));
  });
}

// Stratégie de fetch
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Seulement les requêtes GET
  if (req.method !== "GET") return;

  // Requêtes de navigation (HTML) : network-first
  if (
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html")
  ) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return response;
        })
        .catch(() => {
          return caches
            .match(req)
            .then((cached) => cached || caches.match("./"))
            .then((response) => {
              if (response) return response;
              return caches.match("./offline.html");
            })
            .then((response) => {
              if (response) return response;
              return new Response(
                "<h1>🌟 Amor Fati Offline</h1><p>Pas de connexion. Veuillez vous reconnecter.</p>",
                { headers: { "Content-Type": "text/html; charset=utf-8" } },
              );
            });
        }),
    );
    return;
  }

  // Autres requêtes (assets JS, CSS, images, etc.) : cache-first
  // Les assets Vite ont des hashes dans le nom, donc ils sont immutables
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(req)
        .then((response) => {
          if (
            !response ||
            response.status !== 200 ||
            response.type === "opaque"
          ) {
            return response;
          }

          // Mettre en cache pour la prochaine fois
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return response;
        })
        .catch(() => {
          // Pour les images, retourner un placeholder
          if (req.url.match(/\.(jpg|jpeg|png|gif|svg)$/i)) {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#ccc" width="100" height="100"/></svg>',
              { headers: { "Content-Type": "image/svg+xml" } },
            );
          }
          return new Response("Offline", { status: 503 });
        });
    }),
  );
});

// Gestion des messages des clients
self.addEventListener("message", (event) => {
  if (!event.data) return;

  if (event.data.type === "SKIP_WAITING") {
    console.log("[SW] Skip waiting demandé");
    self.skipWaiting();
    broadcastMessage({ type: "RELOAD_PAGE" });
  }
});
