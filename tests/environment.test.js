import { describe, it, expect } from "vitest";

// ─── Test de validation de l'environnement ───

describe("Environnement de développement", () => {
  it("Node.js est disponible", () => {
    expect(typeof process).toBe("object");
    expect(process.version).toBeTruthy();
  });

  it("Vitest fonctionne avec ES modules", () => {
    expect(1 + 1).toBe(2);
  });

  it("jsdom est disponible", () => {
    expect(typeof document).toBe("object");
    expect(document.createElement("div")).toBeInstanceOf(HTMLElement);
  });
});
