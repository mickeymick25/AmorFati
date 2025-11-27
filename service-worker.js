const CACHE_NAME = "amor-fati-cache-v2";
const PRECACHE_ASSETS = [
  "./",
  "index.html",
  "manifest.json",
  // Icônes PNG (pas SVG)
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-180.png",
  // Splash screens iOS (optionnel)
  "icons/splash-640x1136.png",
  "icons/splash-750x1334.png",
  "icons/splash-1125x2436.png",
  "icons/splash-1242x2208.png",
  "icons/splash-1536x2048.png",
];

// Installation : precache des assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installation...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Mise en cache des assets");
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
          // Mettre en cache la réponse
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return response;
        })
        .catch(() => {
          // Si offline, utiliser le cache ou index.html comme fallback
          return caches
            .match(req)
            .then((cached) => cached || caches.match("index.html"))
            .then(
              (response) =>
                response ||
                new Response(
                  "<h1>🌟 Amor Fati Offline</h1><p>Pas de connexion. Veuillez vous reconnecter.</p>",
                  { headers: { "Content-Type": "text/html; charset=utf-8" } },
                ),
            );
        }),
    );
    return;
  }

  // Autres requêtes (assets) : cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        // Trouv� en cache, le retourner
        return cached;
      }

      // Pas en cache, fetch depuis le réseau
      return fetch(req)
        .then((response) => {
          // Vérifier que la réponse est valide
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
        .catch((err) => {
          console.warn("[SW] Fetch failed:", req.url, err);
          // Pour les images, retourner une image placeholder si possible
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
