// ========================================
// AmorFati — i18n core (i18next + detector)
// ========================================
// Single source of truth for translations and language switching.
// FR is the source language, EN is the first translation target.
// The language is persisted in localStorage under "amorFatiLang".

import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import fr from "./locales/fr.json";
import en from "./locales/en.json";

let initialized = false;

/**
 * Initialize i18next with FR/EN resources and browser-language detection.
 * Safe to call once; subsequent calls are no-ops (returns the same instance).
 * @returns {Promise<typeof i18next>}
 */
export async function initI18n() {
  if (initialized) return i18next;
  await i18next.use(LanguageDetector).init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    fallbackLng: "fr",
    supportedLngs: ["fr", "en"],
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "amorFatiLang",
      caches: ["localStorage"],
    },
    interpolation: {
      // escapeHtml is already applied at render sites; avoid double-escaping.
      escapeValue: false,
    },
  });
  initialized = true;
  return i18next;
}

/**
 * Translate a key with optional interpolation params.
 * @param {string} key — dot path (e.g. "settings.language.title")
 * @param {object} [params] — interpolation values
 * @returns {string} translated string (falls back to key if missing)
 */
export function t(key, params) {
  return i18next.t(key, params);
}

/**
 * @returns {string} current language code ("fr" | "en")
 */
export function getCurrentLang() {
  return i18next.language || "fr";
}

/**
 * Switch the active language. Triggers "languageChanged" listeners.
 * @param {string} lang — "fr" | "en"
 */
export async function setLang(lang) {
  await i18next.changeLanguage(lang);
}

/**
 * Subscribe to language changes.
 * @param {(lang: string) => void} cb
 * @returns {() => void} unsubscribe function
 */
export function onLanguageChanged(cb) {
  i18next.on("languageChanged", cb);
  return () => i18next.off("languageChanged", cb);
}

/**
 * Apply translations to the current document.
 * - Elements with `data-i18n="key"` get textContent = t(key).
 * - Elements with `data-i18n-attr="attr:key;attr2:key2"` get setAttribute(attr, t(key)).
 */
export function translatePage() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    const spec = el.getAttribute("data-i18n-attr");
    if (!spec) return;
    spec.split(";").forEach((pair) => {
      const [attr, key] = pair.split(":").map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });
}

/**
 * Reset the i18n singleton state (for tests only).
 * Detaches all languageChanged listeners and allows re-initialization.
 */
export function _resetI18n() {
  i18next.off("languageChanged");
  initialized = false;
}
