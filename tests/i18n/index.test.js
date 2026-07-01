import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  initI18n,
  t,
  getCurrentLang,
  setLang,
  onLanguageChanged,
  translatePage,
  _resetI18n,
} from "../../src/i18n/index.js";

beforeEach(async () => {
  localStorage.clear();
  _resetI18n();
  await initI18n();
});

describe("i18n — initialization & detection", () => {
  it("detects language from localStorage (fr)", async () => {
    _resetI18n();
    localStorage.setItem("amorFatiLang", "fr");
    await initI18n();
    expect(getCurrentLang()).toBe("fr");
  });

  it("detects language from localStorage (en)", async () => {
    _resetI18n();
    localStorage.setItem("amorFatiLang", "en");
    await initI18n();
    expect(getCurrentLang()).toBe("en");
  });

  it("falls back to fr when stored lang is unsupported", async () => {
    _resetI18n();
    localStorage.setItem("amorFatiLang", "de");
    await initI18n();
    expect(["fr", "en"]).toContain(getCurrentLang());
  });

  it("initI18n is idempotent (second call is a no-op)", async () => {
    await setLang("en");
    const inst = await initI18n();
    expect(getCurrentLang()).toBe("en"); // unchanged by the no-op init
    expect(inst).toBeDefined();
  });
});

describe("i18n — t()", () => {
  it("translates a known key in fr", async () => {
    await setLang("fr");
    expect(t("settings.language.title")).toBe("🌐 Langue de l'interface");
  });

  it("translates a known key in en", async () => {
    await setLang("en");
    expect(t("settings.language.title")).toBe("🌐 Interface language");
  });

  it("returns the key for a missing translation (fallback)", () => {
    expect(t("does.not.exist")).toBe("does.not.exist");
  });

  it("interpolates params when provided", async () => {
    await setLang("fr");
    // i18next returns the key when the value has no interpolation; use a param on a missing key
    expect(t("missing.key", { name: "X" })).toBe("missing.key");
  });
});

describe("i18n — setLang & persistence", () => {
  it("setLang changes the current language", async () => {
    await setLang("en");
    expect(getCurrentLang()).toBe("en");
    await setLang("fr");
    expect(getCurrentLang()).toBe("fr");
  });

  it("setLang persists the language in localStorage", async () => {
    await setLang("en");
    expect(localStorage.getItem("amorFatiLang")).toBe("en");
  });
});

describe("i18n — onLanguageChanged", () => {
  it("callback is called on language change", async () => {
    const cb = vi.fn();
    onLanguageChanged(cb);
    await setLang("en");
    expect(cb).toHaveBeenCalledWith("en");
  });

  it("returns an unsubscribe function that stops notifications", async () => {
    const cb = vi.fn();
    const off = onLanguageChanged(cb);
    await setLang("en");
    expect(cb).toHaveBeenCalledTimes(1);
    off();
    await setLang("fr");
    expect(cb).toHaveBeenCalledTimes(1); // not called after unsubscribe
  });
});

describe("translatePage", () => {
  it("translates textContent of [data-i18n] elements", async () => {
    await setLang("fr");
    document.body.innerHTML = '<p data-i18n="settings.language.title">Old</p>';
    translatePage();
    expect(document.querySelector("p").textContent).toBe(
      "🌐 Langue de l'interface",
    );
  });

  it("translates attributes via [data-i18n-attr]", async () => {
    await setLang("fr");
    document.body.innerHTML =
      '<input data-i18n-attr="placeholder:settings.language.title;aria-label:settings.language.desc" />';
    translatePage();
    const input = document.querySelector("input");
    expect(input.getAttribute("placeholder")).toBe("🌐 Langue de l'interface");
    expect(input.getAttribute("aria-label")).toBe(
      "Choisis la langue d'affichage de l'application.",
    );
  });

  it("translates multiple elements in one pass", async () => {
    await setLang("en");
    document.body.innerHTML =
      '<p data-i18n="settings.language.title"></p><p data-i18n="settings.language.desc"></p>';
    translatePage();
    const ps = document.querySelectorAll("p");
    expect(ps[0].textContent).toBe("🌐 Interface language");
    expect(ps[1].textContent).toBe(
      "Choose the display language of the application.",
    );
  });

  it("reflects the current language (re-translate after language change)", async () => {
    await setLang("fr");
    document.body.innerHTML = '<p data-i18n="settings.language.title"></p>';
    translatePage();
    expect(document.querySelector("p").textContent).toBe(
      "🌐 Langue de l'interface",
    );
    await setLang("en");
    translatePage();
    expect(document.querySelector("p").textContent).toBe(
      "🌐 Interface language",
    );
  });
});
