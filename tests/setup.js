// Vitest setup — jsdom environment
// This file runs before each test suite.

import i18next from "i18next";
import { initI18n, _resetI18n } from "../src/i18n/index.js";

// Initialize i18next once so that t() resolves to real translations in tests.
// Force FR as the default language for deterministic assertions.
beforeAll(async () => {
  localStorage.clear();
  localStorage.setItem("amorFatiLang", "fr");
  _resetI18n();
  await initI18n();
});

beforeEach(async () => {
  // Ensure each test starts in FR (deterministic assertions).
  localStorage.setItem("amorFatiLang", "fr");
  if (i18next.language !== "fr") {
    await i18next.changeLanguage("fr");
  }
});
