// ========================================
// AmorFati — Shared Application State
// ========================================
// Centralizes mutable app state and storage operations.
// Other UI modules import from here to share state.

import { DEFAULT_DATA } from "../domain/assessment.js";
import { validateAppData } from "../domain/assessment.js";
import { migrateData } from "../domain/migration.js";
import { STORAGE_KEY } from "../domain/constants.js";
import { LocalStorageRepository } from "../infrastructure/storage-repository.js";
import { showAlert } from "./modal.js";

export const storage = new LocalStorageRepository(STORAGE_KEY);

export const appState = {
  data: structuredClone(DEFAULT_DATA),
};

export function saveData() {
  try {
    storage.save(appState.data);
  } catch (e) {
    console.error("Erreur de sauvegarde:", e);
    showAlert("⚠️ Erreur lors de la sauvegarde des données.", {
      title: "Erreur",
    });
  }
}

export function loadData() {
  try {
    const stored = storage.load();
    if (!stored) return;

    const migrated = migrateData(stored);
    const validated = validateAppData(migrated);

    const originalCount = stored.assessments ? stored.assessments.length : 0;
    if (validated.assessments.length !== originalCount) {
      console.warn(
        `loadData: filtered out ${originalCount - validated.assessments.length} invalid assessment(s).`,
      );
    }

    appState.data = validated;
  } catch (e) {
    console.error("Erreur de chargement:", e);
    appState.data = structuredClone(DEFAULT_DATA);
  }
}
