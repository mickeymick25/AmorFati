import { t } from "../i18n/index.js";

// ========================================
// Modal System (replaces alert/confirm/prompt)
// ========================================

let modalResolve = null;
let previousFocusElement = null;

export function openModal(title, bodyHtml, actions, { focusSelector } = {}) {
  const overlay = document.getElementById("modalOverlay");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  const modalActions = document.getElementById("modalActions");

  previousFocusElement = document.activeElement;

  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHtml;
  modalActions.innerHTML = "";

  actions.forEach((action) => {
    const btn = document.createElement("button");
    btn.className = `btn ${action.class || ""}`.trim();
    btn.textContent = action.label;
    btn.addEventListener("click", () => {
      closeModal();
      if (modalResolve) {
        modalResolve(action.value);
        modalResolve = null;
      }
    });
    modalActions.appendChild(btn);
  });

  overlay.removeAttribute("hidden");
  overlay.addEventListener("keydown", modalKeydownHandler);

  // Focus first button or specified element
  requestAnimationFrame(() => {
    const focusTarget = focusSelector
      ? overlay.querySelector(focusSelector)
      : modalActions.querySelector("button");
    if (focusTarget) focusTarget.focus();
  });

  return new Promise((resolve) => {
    modalResolve = resolve;
  });
}

export function closeModal() {
  const overlay = document.getElementById("modalOverlay");
  overlay.setAttribute("hidden", "");
  overlay.removeEventListener("keydown", modalKeydownHandler);

  if (previousFocusElement) {
    previousFocusElement.focus();
    previousFocusElement = null;
  }
}

export function modalKeydownHandler(e) {
  if (e.key === "Escape") {
    closeModal();
    if (modalResolve) {
      modalResolve(null);
      modalResolve = null;
    }
  }

  // Focus trap
  if (e.key === "Tab") {
    const overlay = document.getElementById("modalOverlay");
    const focusable = overlay.querySelectorAll(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

export function showAlert(message, { title = t("modal.defaultTitle") } = {}) {
  return openModal(title, `<p>${message}</p>`, [
    { label: t("modal.ok"), value: true, class: "" },
  ]);
}

export function showConfirm(message, { title = t("modal.confirmTitle") } = {}) {
  return openModal(title, `<p>${message}</p>`, [
    { label: t("modal.cancel"), value: false, class: "btn-secondary" },
    { label: t("modal.confirm"), value: true, class: "" },
  ]);
}

export function showDangerConfirm(
  message,
  { title = t("modal.dangerTitle") } = {},
) {
  return openModal(title, `<p>${message}</p>`, [
    { label: t("modal.cancel"), value: false, class: "btn-secondary" },
    { label: t("modal.delete"), value: true, class: "btn-danger" },
  ]);
}

// Reset internal state — used by tests
export function _resetModalState() {
  modalResolve = null;
  previousFocusElement = null;
}
