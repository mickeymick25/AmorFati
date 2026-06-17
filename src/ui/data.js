// ========================================
// AmorFati — Data Management (Export/Import/Delete)
// ========================================

import { CURRENT_SCHEMA_VERSION } from "../domain/migration.js";
import { DEFAULT_DATA } from "../domain/assessment.js";
import { mergeAssessments } from "../domain/merge.js";
import { openModal, showAlert, showDangerConfirm } from "./modal.js";
import { appState, saveData, storage } from "./state.js";
import { displayHistory } from "./renderer.js";
import { switchTab } from "./tabs.js";

export function exportData() {
  const dataStr = storage.exportJSON(appState.data);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `amor-fati-export-${new Date().toISOString().split("T")[0]}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importData(event) {
  const file = event.target.files ? event.target.files[0] : null;
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (e) {
    try {
      const importedData = JSON.parse(e.target.result);

      // Validate structure
      if (
        !importedData.assessments ||
        !Array.isArray(importedData.assessments)
      ) {
        throw new Error("Format de fichier invalide");
      }

      // Validate each assessment
      for (const a of importedData.assessments) {
        if (
          typeof a.date !== "string" ||
          typeof a.totalScore !== "number" ||
          typeof a.dimensionScores !== "object"
        ) {
          throw new Error("Données d'évaluation invalides dans le fichier");
        }
      }

      const count = importedData.assessments.length;
      const existingCount = appState.data.assessments.length;

      const choice = await openModal(
        `📥 Importer ${count} évaluation(s)`,
        `<p>Comment souhaites-tu importer les données ?</p>
         <p><strong>Remplacer</strong> : les données actuelles (${existingCount} évaluation(s)) seront supprimées.<br>
         <strong>Fusionner</strong> : les évaluations importées seront ajoutées aux existantes (les doublons sont ignorés).</p>`,
        [
          { label: "Annuler", value: null, class: "btn-secondary" },
          { label: "Fusionner", value: "merge", class: "" },
          { label: "Remplacer", value: "replace", class: "btn-danger" },
        ],
      );

      if (choice === "replace") {
        appState.data = importedData;
        appState.data.version = CURRENT_SCHEMA_VERSION;
        saveData();
        await showAlert("✅ Données importées avec succès (remplacement) !");
        displayHistory();
        switchTab("history");
      } else if (choice === "merge") {
        const merged = mergeAssessments(
          appState.data.assessments,
          importedData.assessments,
        );
        appState.data.assessments = merged;
        appState.data.version = CURRENT_SCHEMA_VERSION;
        saveData();
        await showAlert(`✅ ${merged.length} évaluation(s) après fusion !`);
        displayHistory();
        switchTab("history");
      }
    } catch (error) {
      await showAlert("❌ Erreur lors de l'import : " + error.message, {
        title: "Erreur",
      });
    }
  };
  reader.readAsText(file);
  // Reset file input
  event.target.value = "";
}

export async function deleteAllData() {
  const firstConfirm = await showDangerConfirm(
    "Es-tu sûr(e) de vouloir supprimer TOUTES tes données ?<br><br>Cette action est irréversible !",
  );

  if (!firstConfirm) return;

  const secondConfirm = await showDangerConfirm(
    "Dernière confirmation : toutes tes évaluations seront perdues définitivement.",
  );

  if (secondConfirm) {
    appState.data = structuredClone(DEFAULT_DATA);
    saveData();
    await showAlert("✅ Toutes les données ont été supprimées.");
    switchTab("welcome");
  }
}
