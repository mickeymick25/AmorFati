// ========================================
// AmorFati — PWA Install & Service Worker
// ========================================

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
                showUpdateBanner(newWorker);
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

    // Listen for SW controller change to auto-reload
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

// ========================================
// Update Banner
// ========================================

function showUpdateBanner(newWorker) {
  const banner = document.getElementById("updateBanner");
  if (!banner) return;

  banner.removeAttribute("hidden");

  const reloadBtn = document.getElementById("updateReloadBtn");
  const dismissBtn = document.getElementById("updateDismissBtn");

  const onReload = () => {
    newWorker.postMessage({ type: "SKIP_WAITING" });
    hideUpdateBanner();
    cleanup();
  };

  const onDismiss = () => {
    hideUpdateBanner();
    cleanup();
  };

  const cleanup = () => {
    reloadBtn.removeEventListener("click", onReload);
    dismissBtn.removeEventListener("click", onDismiss);
  };

  reloadBtn.addEventListener("click", onReload);
  dismissBtn.addEventListener("click", onDismiss);
}

function hideUpdateBanner() {
  const banner = document.getElementById("updateBanner");
  if (banner) banner.setAttribute("hidden", "");
}
