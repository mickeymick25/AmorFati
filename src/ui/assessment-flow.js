// ========================================
// AmorFati — Assessment Flow (one-question-per-screen)
// ========================================
// Navigation logic for the sequenced assessment form.
// 10 question screens (indices 0-9) + 1 context-note screen (index 10).
// The renderer renders all screens in the DOM; this module shows/hides them.

import { t } from "../i18n/index.js";

export const TOTAL_SCREENS = 11; // 10 questions + context-note
const QUESTION_COUNT = 10;
const LAST_SCREEN_INDEX = TOTAL_SCREENS - 1;

let currentQuestion = 0;

function clampIndex(index) {
  if (index < 0) return 0;
  if (index > LAST_SCREEN_INDEX) return LAST_SCREEN_INDEX;
  return index;
}

function getScreen(index) {
  return document.querySelector(`.question-screen[data-index="${index}"]`);
}

function updateProgress(index) {
  const fill = document.querySelector(".progress-fill");
  if (fill) {
    // Progress is relative to the 10 questions only (context screen = 100%).
    const pct = Math.min(100, (index / QUESTION_COUNT) * 100);
    fill.style.width = `${pct}%`;
  }
  const text = document.querySelector(".progress-text");
  if (text) {
    // On the context screen (index 10), show 10/10.
    const shown = Math.min(index + 1, QUESTION_COUNT);
    text.textContent = t("assessment.progress", {
      n: shown,
      total: QUESTION_COUNT,
    });
  }
}

/**
 * Show the screen at the given index, hide all others, update progress + buttons.
 * @param {number} index - 0-based screen index (0-9 questions, 10 context)
 */
export function goToQuestion(index) {
  const target = clampIndex(index);
  currentQuestion = target;

  document.querySelectorAll(".question-screen").forEach((el) => {
    el.classList.remove("active");
  });
  const screen = getScreen(target);
  if (screen) {
    screen.classList.add("active");
  }

  updateProgress(target);
  updateFlowButtons();
}

/**
 * Advance to the next screen (clamped to last).
 */
export function nextQuestion() {
  if (currentQuestion < LAST_SCREEN_INDEX) {
    goToQuestion(currentQuestion + 1);
  }
}

/**
 * Go back to the previous screen (clamped to 0).
 */
export function prevQuestion() {
  if (currentQuestion > 0) {
    goToQuestion(currentQuestion - 1);
  }
}

/**
 * @returns {number} current screen index (0-10)
 */
export function getCurrentQuestion() {
  return currentQuestion;
}

/**
 * @returns {boolean} true if on the last (context-note) screen
 */
export function isLastScreen() {
  return currentQuestion === LAST_SCREEN_INDEX;
}

/**
 * Update the Previous/Next button states based on the current screen:
 * - Previous: hidden on the first screen, visible otherwise.
 * - Next: disabled if no radio selected on a question screen; re-purposed as
 *   "see results" (data-action="see-results") on the last screen.
 */
export function updateFlowButtons() {
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  if (prevBtn) {
    prevBtn.hidden = currentQuestion === 0;
  }
  if (!nextBtn) return;

  if (currentQuestion === LAST_SCREEN_INDEX) {
    // Context screen: button becomes "see results", always enabled.
    nextBtn.disabled = false;
    nextBtn.setAttribute("data-action", "see-results");
    nextBtn.textContent = t("assessment.seeResults");
  } else {
    nextBtn.setAttribute("data-action", "next");
    nextBtn.textContent = t("assessment.next");
    // Disable Next if no radio is checked on the current question screen.
    const screen = getScreen(currentQuestion);
    const checked = screen
      ? screen.querySelector('input[type="radio"]:checked')
      : null;
    nextBtn.disabled = !checked;
  }
}

/**
 * Reset the flow to the first screen.
 */
export function resetFlow() {
  // Clear any previously selected radios so the flow starts clean.
  document
    .querySelectorAll("#assessmentForm input[type=radio]:checked")
    .forEach((r) => (r.checked = false));
  goToQuestion(0);
}
