// ========================================
// AmorFati — Data Management (Export/Import/Delete)
// ========================================

import { CURRENT_SCHEMA_VERSION } from "../domain/migration.js";
import { DEFAULT_DATA } from "../domain/assessment.js";
import { mergeAssessments } from "../domain/merge.js";
import { openModal, showAlert, showDangerConfirm } from "./modal.js";
import { t } from "../i18n/index.js";
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
        throw new Error(t("data.invalidFormat"));
      }

      // Validate each assessment
      for (const a of importedData.assessments) {
        if (
          typeof a.date !== "string" ||
          typeof a.totalScore !== "number" ||
          typeof a.dimensionScores !== "object"
        ) {
          throw new Error(t("data.invalidAssessment"));
        }
      }

      const count = importedData.assessments.length;
      const existingCount = appState.data.assessments.length;

      const choice = await openModal(
        t("data.importTitle", { count }),
        t("data.importBody", { count, existing: existingCount }),
        [
          { label: t("modal.cancel"), value: null, class: "btn-secondary" },
          { label: t("data.mergeBtn"), value: "merge", class: "" },
          {
            label: t("data.replaceBtn"),
            value: "replace",
            class: "btn-danger",
          },
        ],
      );

      if (choice === "replace") {
        appState.data = importedData;
        appState.data.version = CURRENT_SCHEMA_VERSION;
        saveData();
        await showAlert(t("data.importReplaceSuccess"));
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
        await showAlert(t("data.importMergeSuccess", { count: merged.length }));
        displayHistory();
        switchTab("history");
      }
    } catch (error) {
      await showAlert(t("data.importError", { message: error.message }), {
        title: t("data.errorTitle"),
      });
    }
  };
  reader.readAsText(file);
  // Reset file input
  event.target.value = "";
}

export async function deleteAllData() {
  const firstConfirm = await showDangerConfirm(t("data.deleteConfirm1"));

  if (!firstConfirm) return;

  const secondConfirm = await showDangerConfirm(t("data.deleteConfirm2"));

  if (secondConfirm) {
    appState.data = structuredClone(DEFAULT_DATA);
    saveData();
    await showAlert(t("data.deleteSuccess"));
    switchTab("welcome");
  }
}
