import { describe, it, expect, beforeEach } from "vitest";
import { startAssessment, resetForm } from "../../src/ui/assessment.js";
import { appState } from "../../src/ui/state.js";
import { DEFAULT_DATA } from "../../src/domain/assessment.js";

// --- Helpers ---

function setupDOM() {
  // Priority selection (welcome tab) with one option pre-checked
  document.body.innerHTML = `
    <div id="assessmentFormContainer"></div>
    <div id="results" class="results show"></div>
    <div class="nav-tab active" data-tab="welcome" aria-selected="true"></div>
    <div class="nav-tab" data-tab="assessment" aria-selected="false" tabindex="-1"></div>
    <div id="welcome" class="tab-content active"></div>
    <div id="assessment" class="tab-content"></div>
    <div id="historyContent" aria-live="polite"></div>
    <p id="currentPriority"></p>
    <input type="radio" name="priority" value="none" checked />
    <div id="modalOverlay" hidden>
      <div class="modal-content">
        <h3 id="modalTitle"></h3>
        <div id="modalBody"></div>
        <div id="modalActions"></div>
      </div>
    </div>
  `;
}

// --- Tests ---

describe("resetForm", () => {
  beforeEach(() => {
    setupDOM();
    appState.data = structuredClone(DEFAULT_DATA);
    // Pre-fill the form container with a "completed" form state
    document.getElementById("assessmentFormContainer").innerHTML = `
      <form id="assessmentForm">
        <label class="option selected"><input type="radio" name="q1" value="3" checked /></label>
        <label class="option"><input type="radio" name="q2" value="1" /></label>
      </form>
    `;
    document.getElementById("results").classList.add("show");
  });

  it("re-renders a fresh form with no radio checked", () => {
    resetForm();
    const radios = document.querySelectorAll(
      "#assessmentFormContainer input[type=radio]",
    );
    expect(radios.length).toBeGreaterThan(0); // form was rendered
    const checked = document.querySelectorAll(
      "#assessmentFormContainer input[type=radio]:checked",
    );
    expect(checked).toHaveLength(0);
  });

  it("removes the .selected class from all options", () => {
    resetForm();
    const selected = document.querySelectorAll(
      "#assessmentFormContainer .option.selected",
    );
    expect(selected).toHaveLength(0);
  });

  it("hides the results section", () => {
    resetForm();
    expect(document.getElementById("results").classList.contains("show")).toBe(
      false,
    );
  });
});

describe("startAssessment", () => {
  beforeEach(() => {
    setupDOM();
    appState.data = structuredClone(DEFAULT_DATA);
    // Simulate a previously completed assessment visible in the form
    document.getElementById("assessmentFormContainer").innerHTML = `
      <form id="assessmentForm">
        <label class="option selected"><input type="radio" name="q1" value="3" checked /></label>
      </form>
    `;
    document.getElementById("results").classList.add("show");
  });

  it("resets the form before showing the assessment tab", async () => {
    await startAssessment();
    const checked = document.querySelectorAll(
      "#assessmentFormContainer input[type=radio]:checked",
    );
    expect(checked).toHaveLength(0);
    const selected = document.querySelectorAll(
      "#assessmentFormContainer .option.selected",
    );
    expect(selected).toHaveLength(0);
  });

  it("hides previous results", async () => {
    await startAssessment();
    expect(document.getElementById("results").classList.contains("show")).toBe(
      false,
    );
  });

  it("saves the selected priority into appState", async () => {
    await startAssessment();
    expect(appState.data.priority).toBe("none");
  });

  it("does not reset when no priority is selected", async () => {
    document.querySelector('input[name="priority"]:checked').checked = false;
    const promise = startAssessment();
    // startAssessment opens an alert modal; resolve it by clicking OK.
    await new Promise((r) => setTimeout(r, 0));
    const okBtn = document.querySelector("#modalActions button");
    if (okBtn) okBtn.click();
    await promise;
    // Form should be untouched (still has the checked radio from setup)
    const checked = document.querySelectorAll(
      "#assessmentFormContainer input[type=radio]:checked",
    );
    expect(checked).toHaveLength(1);
  });
});
