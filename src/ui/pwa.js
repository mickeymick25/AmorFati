// ========================================
// AmorFati — PWA Install & Service Worker
// ========================================

import { showConfirm } from "./modal.js";

let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const prompt = document.getElementById("installPrompt");
  if (prompt) prompt.classList.add("show");
});

export function installApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      deferredPrompt = null;
      dismissInstall();
    });
  }
}

export function dismissInstall() {
  const prompt = document.getElementById("installPrompt");
  if (prompt) prompt.classList.remove("show");
}

// ========================================
// Service Worker Registration
// ========================================

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const isGitHubPages = location.hostname.includes("github.io");
    const scope = isGitHubPages ? "/AmorFati/" : "/";

    navigator.serviceWorker
      .register("service-worker.js", { scope })
      .then((reg) => {
        console.log("✅ ServiceWorker enregistré:", reg.scope);

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          console.log("🔄 Mise à jour du SW détectée");

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                console.log("✨ Nouvelle version disponible");
                showConfirm(
                  "Une nouvelle version est disponible. Recharger maintenant ?",
                  { title: "✨ Mise à jour disponible" },
                ).then((confirmed) => {
                  if (confirmed) {
                    newWorker.postMessage({ type: "SKIP_WAITING" });
                  }
                });
              } else {
                console.log("✅ SW installé pour la première fois");
              }
            }
          });
        });
      })
      .catch((err) => {
        console.warn("⚠️ Erreur ServiceWorker:", err);
      });

    // Listen for SW messages
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "RELOAD_PAGE") {
        window.location.reload();
      }
    });
  });
}
