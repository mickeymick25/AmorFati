// ========================================
// AmorFati — Assessment Flow
// ========================================

import { DIMENSIONS } from "../domain/questions.js";
import { showAlert } from "./modal.js";
import { t } from "../i18n/index.js";
import { appState, saveData } from "./state.js";
import { displayResults, renderAssessmentForm } from "./renderer.js";
import { switchTab } from "./tabs.js";

export async function startAssessment() {
  const selectedPriority = document.querySelector(
    'input[name="priority"]:checked',
  );
  if (!selectedPriority) {
    await showAlert(t("assessment.selectPriorityAlert"));
    return;
  }

  appState.data.priority = selectedPriority.value;
  saveData();
  resetForm();
  switchTab("assessment");
}

export async function calculateResults() {
  const form = document.getElementById("assessmentForm");
  const formData = new FormData(form);

  // Validate all questions answered
  const totalQuestions = 10;
  let answeredQuestions = 0;
  for (let i = 1; i <= totalQuestions; i++) {
    if (formData.get(`q${i}`)) answeredQuestions++;
  }

  if (answeredQuestions < totalQuestions) {
    await showAlert(
      t("assessment.incompleteAlert", {
        answered: answeredQuestions,
        total: totalQuestions,
      }),
    );
    return;
  }

  // Calculate dimension scores
  let totalScore = 0;
  let dimensionScores = {};
  let answers = {};

  for (const [dimension, questions] of Object.entries(DIMENSIONS)) {
    let dimScore = 0;
    questions.forEach((q) => {
      const score = parseInt(formData.get(q));
      dimScore += score;
      answers[q] = score;
    });
    dimensionScores[dimension] = dimScore;
    totalScore += dimScore;
  }

  // Save assessment
  const assessment = {
    date: new Date().toISOString(),
    totalScore: totalScore,
    dimensionScores: dimensionScores,
    answers: answers,
    context: document.getElementById("contextNote").value,
    priority: appState.data.priority,
  };

  appState.data.assessments.push(assessment);
  appState.data.settings.lastAssessment = assessment.date;
  saveData();

  // Display results
  displayResults(assessment);

  // Scroll to results
  document.getElementById("results").scrollIntoView({ behavior: "smooth" });
}

export function resetForm() {
  // Re-render a fresh form (blank, shuffled options) so the previous
  // answers never bias the next assessment.
  renderAssessmentForm();
  const results = document.getElementById("results");
  if (results) results.classList.remove("show");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function viewAssessmentDetails(index) {
  const assessment = appState.data.assessments[index];
  if (!assessment) return;
  displayResults(assessment);
  switchTab("assessment");
}
