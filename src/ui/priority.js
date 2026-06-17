// ========================================
// AmorFati — Priority Selector
// ========================================

import { showAlert, openModal } from "./modal.js";
import { appState, saveData } from "./state.js";
import { displaySettings } from "./renderer.js";

async function showPrioritySelector() {
  const priorities = [
    {
      key: "ressentiment",
      label: "🔥 Passé & Ressentiment",
      desc: "Me libérer du poids de mon passé",
    },
    {
      key: "souffrance",
      label: "⚡ Souffrance présente",
      desc: "Mieux accepter les difficultés actuelles",
    },
    {
      key: "authenticite",
      label: "🎭 Authenticité",
      desc: "Vivre selon mes propres valeurs",
    },
    {
      key: "creation",
      label: "🎨 Création",
      desc: "Devenir un créateur actif de ma vie",
    },
    {
      key: "eternel",
      label: "♾️ Éternel Retour",
      desc: "Affirmer totalement ma vie",
    },
    {
      key: "none",
      label: "🧭 Aucune priorité",
      desc: "Observer mon évolution globale",
    },
  ];

  const optionsHtml = priorities
    .map(
      (p) =>
        `<label class="modal-priority-option">
      <input type="radio" name="modalPriority" value="${p.key}"${appState.data.priority === p.key ? " checked" : ""} />
      <div>
        <span class="modal-priority-label">${p.label}</span>
        <span class="modal-priority-desc">${p.desc}</span>
      </div>
    </label>`,
    )
    .join("");

  const bodyHtml = `<p>Quelle dimension souhaites-tu voir évoluer en priorité ?</p><div class="modal-priority-options">${optionsHtml}</div>`;

  const result = await openModal(
    "Modifier ma priorité",
    bodyHtml,
    [
      { label: "Annuler", value: null, class: "btn-secondary" },
      { label: "Confirmer", value: true, class: "" },
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
      await showAlert("✅ Ta priorité a été mise à jour !");
    }
  }

  return result;
}

export async function changePriority() {
  await showPrioritySelector();
}
