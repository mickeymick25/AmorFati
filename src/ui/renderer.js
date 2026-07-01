// ========================================
// AmorFati — DOM Rendering Functions
// ========================================
// All functions that read/write the DOM to display content.
// They import appState for data but don't handle events.

import {
  PRIORITY_LABELS,
  PRIORITY_LABELS_FULL,
  QUESTIONS,
  DIMENSION_INFO,
  getInterpretation,
  getRecommendations,
  escapeHtml,
  shuffle,
} from "../logic.js";
import { appState } from "./state.js";
import { t, getCurrentLang } from "../i18n/index.js";

// ========================================
// Assessment Form
// ========================================

export function renderAssessmentForm() {
  const container = document.getElementById("assessmentFormContainer");
  if (!container) return;

  let html = '<form id="assessmentForm">';

  for (const dim of DIMENSION_INFO) {
    const dimQuestions = QUESTIONS.filter((q) => q.dimension === dim.name);

    html += '<div class="dimension">';
    html += `<h2>${escapeHtml(t(`dimension.${dim.order}.title`))}</h2>`;
    html += `<p class="dimension-description">${escapeHtml(t(`dimension.${dim.order}.description`))}</p>`;

    for (const question of dimQuestions) {
      html += '<div class="question">';
      html += `<div class="question-text">${escapeHtml(t(`${question.id}.text`))}</div>`;
      html += '<div class="options">';

      for (const option of shuffle(question.options)) {
        html += '<label class="option">';
        html += `<input type="radio" name="${escapeHtml(question.id)}" value="${option.value}" />`;
        html += '<span class="option-label">';
        html += escapeHtml(t(`${question.id}.opt${option.value}`));
        html += "</span>";
        html += "</label>";
      }

      html += "</div>";
      html += "</div>";
    }

    html += "</div>";
  }

  // Context Note
  html += '<div class="context-note">';
  html +=
    '<label for="contextNote">' +
    escapeHtml(t("assessment.contextLabel")) +
    "</label>";
  html += `<textarea id="contextNote" data-i18n-attr="placeholder:assessment.contextPlaceholder" placeholder="${escapeHtml(t("assessment.contextPlaceholder"))}"></textarea>`;
  html += "</div>";

  html += '<button type="button" class="btn" onclick="calculateResults()">';
  html += escapeHtml(t("assessment.calculateBtn"));
  html += "</button>";
  html += "</form>";

  container.innerHTML = html;
}

// ========================================
// Results Display
// ========================================

// Dimension name (FR, stored in data) → i18n key fragment.
// The dimension names are stored as French strings in the saved data
// (dimensionScores keys); this maps them to translation keys.
const DIMENSION_I18N_KEYS = {
  "Passé & Ressentiment": 1,
  "Souffrance présente": 2,
  Authenticité: 3,
  Création: 4,
  "Éternel Retour": 5,
};

function dimensionLabel(name) {
  const order = DIMENSION_I18N_KEYS[name];
  if (!order) return escapeHtml(name);
  return escapeHtml(t(`dimension.${order}.title`));
}

function resolveRecommendation(key) {
  // Marker for the dynamic "focus on lowest dimension" recommendation.
  const m = /^__focus__(.+)__(\d+)__$/.exec(key);
  if (m) {
    const [, dim, score] = m;
    return `<strong>${escapeHtml(t("results.focusDimension", { dimension: dimensionLabel(dim), score }))}</strong>`;
  }
  return escapeHtml(t(key));
}

export function displayResults(assessment) {
  const resultsDiv = document.getElementById("results");
  if (!resultsDiv) return;

  const interpretation = getInterpretation(assessment.totalScore);
  const recommendations = getRecommendations(
    assessment.dimensionScores,
    appState.data.priority,
  );

  const interpHtml = interpretation
    ? `<div class="interpretation">
        <h3>${escapeHtml(t(`interpretation.${interpretation.index}.title`))}</h3>
        ${[0, 1, 2]
          .map(
            (i) =>
              `<p>${escapeHtml(t(`interpretation.${interpretation.index}.text${i}`))}</p>`,
          )
          .join("")}
    </div>`
    : "";

  let html = `
    <div class="total-score">${escapeHtml(t("results.totalScore", { score: assessment.totalScore }))}</div>

    ${interpHtml}

    <div class="dimension-scores">
    `;

  for (const [dimension, score] of Object.entries(assessment.dimensionScores)) {
    const percentage = (score / 8) * 100;
    html += `
        <div class="dimension-score">
            <h4>${dimensionLabel(dimension)}</h4>
            <div class="dimension-score-value">${score}/8</div>
            <div class="score-bar">
                <div class="score-fill" style="width: ${percentage}%"></div>
            </div>
        </div>
        `;
  }

  html += `
    </div>

    ${getEvolutionComparison()}

    <div class="interpretation">
        <h3>${escapeHtml(t("results.recommendationsTitle"))}</h3>
        ${recommendations.map((r) => `<p>→ ${resolveRecommendation(r)}</p>`).join("")}
    </div>

    <button class="btn" onclick="resetForm()">${escapeHtml(t("assessment.newAssessmentBtn"))}</button>
    `;

  resultsDiv.innerHTML = html;
  resultsDiv.classList.add("show");
}

export function getEvolutionComparison() {
  if (appState.data.assessments.length < 2) {
    return `<div class="alert alert-info" role="status">${escapeHtml(t("results.evolutionContinue"))}</div>`;
  }

  const current =
    appState.data.assessments[appState.data.assessments.length - 1];
  const previous =
    appState.data.assessments[appState.data.assessments.length - 2];

  const diff = current.totalScore - previous.totalScore;
  const diffText = diff > 0 ? `+${diff}` : diff;
  const diffColor = diff > 0 ? "#28a745" : diff < 0 ? "#dc3545" : "#6c757d";
  const emoji = diff > 0 ? "📈" : diff < 0 ? "📉" : "➡️";

  const previousDate = new Intl.DateTimeFormat(getCurrentLang(), {
    dateStyle: "long",
  }).format(new Date(previous.date));

  let html = `
    <div class="alert alert-info" role="status">
        <strong>${emoji} ${escapeHtml(t("results.evolutionSince", { date: previousDate }))}</strong><br>
        ${escapeHtml(t("results.previousScore", { score: previous.totalScore }))}<br>
        ${escapeHtml(t("results.currentScore", { score: current.totalScore }))}<br>
        ${escapeHtml(t("results.evolution", { diff: diffText }))}
        <span class="evolution-diff" style="color: ${diffColor};">${diffText} points</span>
    </div>
    `;

  html += `<div class="evolution-section-title"><strong>${escapeHtml(t("results.byDimension"))}</strong></div>`;
  html += '<div class="dimension-scores">';

  for (const dimension in current.dimensionScores) {
    const currentScore = current.dimensionScores[dimension];
    const previousScore = previous.dimensionScores[dimension] || 0;
    const dimDiff = currentScore - previousScore;
    const dimDiffText = dimDiff > 0 ? `+${dimDiff}` : dimDiff;
    const dimDiffColor =
      dimDiff > 0 ? "#28a745" : dimDiff < 0 ? "#dc3545" : "#6c757d";

    html += `
        <div class="dimension-score">
            <h4>${dimensionLabel(dimension)}</h4>
            <div class="dimension-score-value">${currentScore}/8 <span class="dim-diff" style="color: ${dimDiffColor};">(${dimDiffText})</span></div>
            <div class="score-bar">
                <div class="score-fill" style="width: ${(currentScore / 8) * 100}%"></div>
            </div>
        </div>
        `;
  }

  html += "</div>";

  return html;
}

// ========================================
// History
// ========================================

export function displayHistory() {
  const historyContent = document.getElementById("historyContent");
  if (!historyContent) return;

  if (appState.data.assessments.length === 0) {
    historyContent.innerHTML = `
        <div class="history-empty">
            <h3>${escapeHtml(t("history.emptyTitle"))}</h3>
            <p>${escapeHtml(t("history.emptyDesc"))}</p>
            <button class="btn" onclick="switchTab('assessment')">${escapeHtml(t("history.emptyBtn"))}</button>
        </div>
        `;
    return;
  }

  const sortedAssessments = [...appState.data.assessments].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  let html = '<div class="chart-container">';
  html += `<div class="chart-title">${escapeHtml(t("history.chartTitle"))}</div>`;
  html += createChart(sortedAssessments.slice().reverse());
  html += "</div>";

  html += '<div class="history-list">';

  sortedAssessments.forEach((assessment, index) => {
    const date = new Date(assessment.date);
    const dateStr = new Intl.DateTimeFormat(getCurrentLang(), {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
    const timeStr = new Intl.DateTimeFormat(getCurrentLang(), {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

    html += `
        <div class="history-item" onclick="viewAssessmentDetails(${appState.data.assessments.length - 1 - index})" role="button" tabindex="0" aria-label="Évaluation du ${escapeHtml(dateStr)}">
            <div class="history-header">
                <div class="history-date">${escapeHtml(dateStr)} à ${escapeHtml(timeStr)}</div>
                <div class="history-score">${assessment.totalScore}/40</div>
            </div>
            ${assessment.context ? `<div class="history-context">"${escapeHtml(assessment.context)}"</div>` : ""}
            <div class="history-priority">${escapeHtml(t("history.priorityLabel", { priority: PRIORITY_LABELS[assessment.priority] || t("settings.priorityUndefined") }))}</div>
        </div>
        `;
  });

  html += "</div>";

  historyContent.innerHTML = html;
}

export function createChart(assessments) {
  if (!assessments || assessments.length < 2) {
    return `<p class="chart-empty">${escapeHtml(t("history.chartEmpty"))}</p>`;
  }

  const height = 200;
  const padding = 30;
  const maxScore = 40;

  const points = assessments.map((a, i) => {
    const x = padding + (i / (assessments.length - 1)) * (100 - 2 * padding);
    const y =
      height - padding - (a.totalScore / maxScore) * (height - 2 * padding);
    return { x, y, score: a.totalScore, date: new Date(a.date) };
  });

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i].x} ${points[i].y}`;
  }

  let svg = `
  <svg viewBox="0 0 100 ${height}" style="width: 100%; height: ${height}px; background: #f8f9fa; border-radius: 8px;" role="img" data-i18n-attr="aria-label:history.chartAriaLabel" aria-label="Graphique d'évolution du score Amor Fati">
        <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#ddd" stroke-width="0.5"/>
        <line x1="${padding}" y1="${height - padding}" x2="${100 - padding}" y2="${height - padding}" stroke="#ddd" stroke-width="0.5"/>

        ${[0, 10, 20, 30, 40]
          .map((score) => {
            const y =
              height - padding - (score / maxScore) * (height - 2 * padding);
            return `
            <line x1="${padding}" y1="${y}" x2="${100 - padding}" y2="${y}" stroke="#e0e0e0" stroke-width="0.3" stroke-dasharray="2,2"/>
            <text x="${padding - 3}" y="${y + 1}" font-size="3" fill="#555" text-anchor="end">${score}</text>
            `;
          })
          .join("")}

        <path d="${pathD}" fill="none" stroke="url(#gradient)" stroke-width="1" stroke-linecap="round"/>

        ${points
          .map(
            (p) => `
        <circle cx="${p.x}" cy="${p.y}" r="1.5" fill="#667eea"/>
        <title>${new Intl.DateTimeFormat(getCurrentLang(), { dateStyle: "long" }).format(p.date)} : ${p.score}/40</title>
        `,
          )
          .join("")}

        <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
        </defs>
    </svg>
    `;

  return svg;
}

// ========================================
// Settings Display
// ========================================

export function displaySettings() {
  const el = document.getElementById("currentPriority");
  if (el) {
    const priorityKey = appState.data.priority;
    if (priorityKey) {
      el.textContent =
        t(`priority.${priorityKey}.full`) ||
        PRIORITY_LABELS_FULL[priorityKey] ||
        t("settings.priorityUndefined");
    } else {
      el.textContent = t("settings.priorityUndefined");
    }
  }
}
