import { describe, it, expect, beforeEach } from "vitest";
import {
  goToQuestion,
  nextQuestion,
  prevQuestion,
  getCurrentQuestion,
  isLastScreen,
  updateFlowButtons,
  resetFlow,
  TOTAL_SCREENS,
} from "../../src/ui/assessment-flow.js";

// --- Helpers ---

function setupFlowDOM() {
  // 10 question screens (each with one radio group) + 1 context-note screen
  const screens = [];
  for (let i = 0; i < 10; i++) {
    screens.push(`
      <div class="question-screen" data-index="${i}">
        <input type="radio" name="q${i + 1}" value="0" />
        <input type="radio" name="q${i + 1}" value="4" />
      </div>`);
  }
  screens.push(`
    <div class="question-screen" data-index="10">
      <textarea id="contextNote"></textarea>
    </div>`);

  document.body.innerHTML = `
    <div id="assessmentFormContainer">
      <form id="assessmentForm">
        <div class="progress-bar"><div class="progress-fill"></div></div>
        <div class="progress-text" aria-live="polite"></div>
        ${screens.join("")}
        <div class="flow-buttons">
          <button type="button" class="btn btn-secondary" id="prevBtn">Précédent</button>
          <button type="button" class="btn" id="nextBtn">Suivant</button>
        </div>
      </form>
    </div>
  `;
}

// --- Tests ---

describe("assessment-flow", () => {
  beforeEach(() => {
    setupFlowDOM();
    resetFlow();
  });

  describe("goToQuestion", () => {
    it("shows only the target screen and marks it active", () => {
      goToQuestion(3);
      const screens = document.querySelectorAll(".question-screen");
      expect(screens[3].classList.contains("active")).toBe(true);
      expect(screens[0].classList.contains("active")).toBe(false);
      expect(screens[9].classList.contains("active")).toBe(false);
    });

    it("updates the progress bar width", () => {
      goToQuestion(5);
      const fill = document.querySelector(".progress-fill");
      // Screen 5 out of 10 questions (context screen excluded from progress)
      expect(parseFloat(fill.style.width)).toBe(50);
    });

    it("updates the progress text with n/total", () => {
      goToQuestion(2);
      const text = document.querySelector(".progress-text");
      // Screen index 2 = 3rd question (1-based display, Duolingo-style)
      expect(text.textContent).toContain("3");
      expect(text.textContent).toContain("10");
    });

    it("clamps out-of-range indices", () => {
      goToQuestion(-1);
      expect(getCurrentQuestion()).toBe(0);
      goToQuestion(99);
      expect(getCurrentQuestion()).toBe(TOTAL_SCREENS - 1);
    });
  });

  describe("nextQuestion / prevQuestion", () => {
    it("nextQuestion advances by one screen", () => {
      resetFlow();
      nextQuestion();
      expect(getCurrentQuestion()).toBe(1);
    });

    it("nextQuestion does not go beyond the last screen", () => {
      goToQuestion(TOTAL_SCREENS - 1);
      nextQuestion();
      expect(getCurrentQuestion()).toBe(TOTAL_SCREENS - 1);
    });

    it("prevQuestion goes back by one screen", () => {
      goToQuestion(5);
      prevQuestion();
      expect(getCurrentQuestion()).toBe(4);
    });

    it("prevQuestion does not go below 0", () => {
      resetFlow();
      prevQuestion();
      expect(getCurrentQuestion()).toBe(0);
    });
  });

  describe("isLastScreen", () => {
    it("returns false on a question screen", () => {
      goToQuestion(5);
      expect(isLastScreen()).toBe(false);
    });

    it("returns true on the context-note screen (last)", () => {
      goToQuestion(TOTAL_SCREENS - 1);
      expect(isLastScreen()).toBe(true);
    });
  });

  describe("updateFlowButtons", () => {
    it("hides the Previous button on the first screen", () => {
      resetFlow();
      updateFlowButtons();
      const prevBtn = document.getElementById("prevBtn");
      expect(prevBtn.hidden).toBe(true);
    });

    it("shows the Previous button on any screen after the first", () => {
      goToQuestion(1);
      updateFlowButtons();
      expect(document.getElementById("prevBtn").hidden).toBe(false);
    });

    it("disables Next when no radio is selected on a question screen", () => {
      goToQuestion(0);
      updateFlowButtons();
      expect(document.getElementById("nextBtn").disabled).toBe(true);
    });

    it("enables Next when a radio is selected on the current question screen", () => {
      goToQuestion(0);
      document.querySelector('input[name="q1"][value="4"]').checked = true;
      updateFlowButtons();
      expect(document.getElementById("nextBtn").disabled).toBe(false);
    });

    it("labels Next as 'see results' on the last (context) screen", () => {
      goToQuestion(TOTAL_SCREENS - 1);
      updateFlowButtons();
      const nextBtn = document.getElementById("nextBtn");
      // The button is re-purposed to call calculateResults on the last screen
      expect(nextBtn.getAttribute("data-action")).toBe("see-results");
    });

    it("enables Next on the context-note screen (no radio required)", () => {
      goToQuestion(TOTAL_SCREENS - 1);
      updateFlowButtons();
      expect(document.getElementById("nextBtn").disabled).toBe(false);
    });
  });

  describe("resetFlow", () => {
    it("resets to the first screen", () => {
      goToQuestion(7);
      resetFlow();
      expect(getCurrentQuestion()).toBe(0);
      expect(
        document
          .querySelector('.question-screen[data-index="0"]')
          .classList.contains("active"),
      ).toBe(true);
    });
  });
});
