// ========================================
// AmorFati — Application Entry Point
// ========================================
// Thin orchestrator: imports modules, wires DOM events,
// exposes functions to global scope for onclick handlers.

// --- State & Data ---
import { loadData } from "./src/ui/state.js";

// --- Rendering ---
import {
  renderAssessmentForm,
  displayHistory,
  displaySettings,
} from "./src/ui/renderer.js";

// --- Tabs ---
import { switchTab, handleTabKeydown } from "./src/ui/tabs.js";

// --- Assessment ---
import {
  startAssessment,
  calculateResults,
  resetForm,
  viewAssessmentDetails,
} from "./src/ui/assessment.js";

// --- Data Management ---
import { exportData, importData, deleteAllData } from "./src/ui/data.js";

// --- Priority ---
import { changePriority } from "./src/ui/priority.js";

// --- PWA ---
import { installApp, dismissInstall } from "./src/ui/pwa.js";

// ========================================
// Expose functions to global scope for onclick handlers
// ========================================

window.switchTab = switchTab;
window.startAssessment = startAssessment;
window.calculateResults = calculateResults;
window.resetForm = resetForm;
window.exportData = exportData;
window.deleteAllData = deleteAllData;
window.changePriority = changePriority;
window.installApp = installApp;
window.dismissInstall = dismissInstall;
window.viewAssessmentDetails = viewAssessmentDetails;

// ========================================
// Initialization
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  renderAssessmentForm();
  loadData();
  displaySettings();
  displayHistory();

  // Wire option selection (radio buttons in assessment form)
  document.querySelectorAll(".option").forEach((option) => {
    option.addEventListener("click", function () {
      const radio = this.querySelector('input[type="radio"]');
      const name = radio.name;
      document.querySelectorAll(`input[name="${name}"]`).forEach((r) => {
        r.parentElement.classList.remove("selected");
      });
      radio.checked = true;
      this.classList.add("selected");
    });
  });

  // Wire priority selection
  document.querySelectorAll(".priority-option").forEach((option) => {
    option.addEventListener("click", function () {
      const radio = this.querySelector('input[type="radio"]');
      document.querySelectorAll(".priority-option").forEach((opt) => {
        opt.classList.remove("selected");
      });
      radio.checked = true;
      this.classList.add("selected");
    });
  });

  // Wire import file input
  const importInput = document.getElementById("importFile");
  if (importInput) importInput.addEventListener("change", importData);

  // Wire modal priority option selection
  document.addEventListener("click", (e) => {
    const option = e.target.closest(".modal-priority-option");
    if (option) {
      const radio = option.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        document
          .querySelectorAll(".modal-priority-option")
          .forEach((opt) => opt.classList.remove("selected"));
        option.classList.add("selected");
      }
    }
  });

  // Keyboard navigation for tabs
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.addEventListener("keydown", handleTabKeydown);
  });
});
