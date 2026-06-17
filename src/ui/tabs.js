// ========================================
// AmorFati — Tab Navigation
// ========================================

import { displayHistory } from "./renderer.js";
import { displaySettings } from "./renderer.js";

export function switchTab(tabName) {
  document
    .querySelectorAll(".nav-tab")
    .forEach((tab) => tab.classList.remove("active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((content) => content.classList.remove("active"));

  const tabBtn = document.querySelector(`.nav-tab[data-tab="${tabName}"]`);
  if (tabBtn) {
    tabBtn.classList.add("active");
    tabBtn.setAttribute("aria-selected", "true");
    tabBtn.removeAttribute("tabindex");
  }

  // Update other tabs
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    if (tab.dataset.tab !== tabName) {
      tab.setAttribute("aria-selected", "false");
      tab.setAttribute("tabindex", "-1");
    }
  });

  const tabContent = document.getElementById(tabName);
  if (tabContent) tabContent.classList.add("active");

  if (tabName === "history") displayHistory();
  else if (tabName === "settings") displaySettings();
}

export function handleTabKeydown(e) {
  const tabs = Array.from(document.querySelectorAll(".nav-tab"));
  const currentIndex = tabs.indexOf(e.target);

  let newIndex;

  switch (e.key) {
    case "ArrowRight":
    case "ArrowDown":
      e.preventDefault();
      newIndex = (currentIndex + 1) % tabs.length;
      break;
    case "ArrowLeft":
    case "ArrowUp":
      e.preventDefault();
      newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      break;
    case "Home":
      e.preventDefault();
      newIndex = 0;
      break;
    case "End":
      e.preventDefault();
      newIndex = tabs.length - 1;
      break;
    default:
      return;
  }

  tabs[newIndex].focus();
  switchTab(tabs[newIndex].dataset.tab);
}
