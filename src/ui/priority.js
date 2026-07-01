// ========================================
// AmorFati — Priority Selector
// ========================================

import { showAlert, openModal } from "./modal.js";
import { t } from "../i18n/index.js";
import { appState, saveData } from "./state.js";
import { displaySettings } from "./renderer.js";

async function showPrioritySelector() {
  const priorities = [
    { key: "ressentiment" },
    { key: "souffrance" },
    { key: "authenticite" },
    { key: "creation" },
    { key: "eternel" },
    { key: "none" },
  ];

  const optionsHtml = priorities
    .map(
      (p) =>
        `<label class="modal-priority-option">
      <input type="radio" name="modalPriority" value="${p.key}"${appState.data.priority === p.key ? " checked" : ""} />
      <div>
        <span class="modal-priority-label">${t(`priority.${p.key}.label`)}</span>
        <span class="modal-priority-desc">${t(`priority.${p.key}.short`)}</span>
      </div>
    </label>`,
    )
    .join("");

  const bodyHtml = `${t("priorityModal.body")}<div class="modal-priority-options">${optionsHtml}</div>`;

  const result = await openModal(
    t("priorityModal.title"),
    bodyHtml,
    [
      { label: t("modal.cancel"), value: null, class: "btn-secondary" },
      { label: t("priorityModal.confirmBtn"), value: true, class: "" },
    ],
    { focusSelector: ".modal-priority-option" },
  );

  if (result) {
    const selected = document.querySelector(
      'input[name="modalPriority"]:checked',
    );
    if (selected) {
      appState.data.priority = selected.value;
      saveData();
      displaySettings();
      await showAlert(t("priorityModal.updatedAlert"));
    }
  }

  return result;
}

export async function changePriority() {
  await showPrioritySelector();
}
