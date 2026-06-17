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
} from "../logic.js";
import { appState } from "./state.js";

// ========================================
// Assessment Form
// ========================================

export function renderAssessmentForm() {
  const container = document.getElementById("assessmentFormContainer");
  if (!container) return;

  const scoreBadgeLabels = ["0 pt", "1 pt", "2 pts", "3 pts", "4 pts"];

  let html = '<form id="assessmentForm">';

  for (const dim of DIMENSION_INFO) {
    const dimQuestions = QUESTIONS.filter((q) => q.dimension === dim.name);

    html += '<div class="dimension">';
    html += `<h2>${escapeHtml(dim.title)}</h2>`;
    html += `<p class="dimension-description">${escapeHtml(dim.description)}</p>`;

    for (const question of dimQuestions) {
      html += '<div class="question">';
      html += `<div class="question-text">${escapeHtml(question.text)}</div>`;
      html += '<div class="options">';

      for (const option of question.options) {
        html += '<label class="option">';
        html += `<input type="radio" name="${escapeHtml(question.id)}" value="${option.value}" />`;
        html += '<span class="option-label">';
        html += `${escapeHtml(option.label)} <span class="score-badge">${scoreBadgeLabels[option.value]}</span>`;
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
  html += '<label for="contextNote">📝 Note de contexte (optionnel)</label>';
  html +=
    '<textarea id="contextNote" placeholder="Que se passe-t-il dans ta vie en ce moment ? (ex: semaine difficile au travail, période de calme, événement marquant...)"></textarea>';
  html += "</div>";

  html += '<button type="button" class="btn" onclick="calculateResults()">';
  html += "📊 Calculer mon score";
  html += "</button>";
  html += "</form>";

  container.innerHTML = html;
}

// ========================================
// Results Display
// ========================================

export function displayResults(assessment) {
  const resultsDiv = document.getElementById("results");
  if (!resultsDiv) return;

  const interpretation = getInterpretation(assessment.totalScore);
  const recommendations = getRecommendations(
    assessment.dimensionScores,
    appState.data.priority,
  );

  let html = `
    <div class="total-score">Score total : ${assessment.totalScore}/40</div>

    <div class="interpretation">
        <h3>${escapeHtml(interpretation.title)}</h3>
        ${interpretation.text.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
    </div>

    <div class="dimension-scores">
    `;

  for (const [dimension, score] of Object.entries(assessment.dimensionScores)) {
    const percentage = (score / 8) * 100;
    html += `
        <div class="dimension-score">
            <h4>${escapeHtml(dimension)}</h4>
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
        <h3>🎯 Recommandations personnalisées</h3>
        ${recommendations.map((r) => `<p>→ ${r}</p>`).join("")}
    </div>

    <button class="btn" onclick="resetForm()">Nouvelle évaluation</button>
    `;

  resultsDiv.innerHTML = html;
  resultsDiv.classList.add("show");
}

export function getEvolutionComparison() {
  if (appState.data.assessments.length < 2) {
    return '<div class="alert alert-info" role="status">Continue à t\'évaluer régulièrement pour voir ton évolution dans le temps.</div>';
  }

  const current =
    appState.data.assessments[appState.data.assessments.length - 1];
  const previous =
    appState.data.assessments[appState.data.assessments.length - 2];

  const diff = current.totalScore - previous.totalScore;
  const diffText = diff > 0 ? `+${diff}` : diff;
  const diffColor = diff > 0 ? "#28a745" : diff < 0 ? "#dc3545" : "#6c757d";
  const emoji = diff > 0 ? "📈" : diff < 0 ? "📉" : "➡️";

  const previousDate = new Date(previous.date).toLocaleDateString("fr-FR");

  let html = `
    <div class="alert alert-info" role="status">
        <strong>${emoji} Évolution depuis le ${escapeHtml(previousDate)}</strong><br>
        Score précédent : ${previous.totalScore}/40<br>
        Score actuel : ${current.totalScore}/40<br>
        Évolution : <span class="evolution-diff" style="color: ${diffColor};">${diffText} points</span>
    </div>
    `;

  html +=
    '<div class="evolution-section-title"><strong>Évolution par dimension :</strong></div>';
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
            <h4>${escapeHtml(dimension)}</h4>
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
            <h3>📊 Aucune évaluation pour le moment</h3>
            <p>Commence ta première évaluation pour suivre ton évolution.</p>
            <button class="btn" onclick="switchTab('assessment')">Faire une évaluation</button>
        </div>
        `;
    return;
  }

  const sortedAssessments = [...appState.data.assessments].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  let html = '<div class="chart-container">';
  html += '<div class="chart-title">📈 Évolution de ton score Amor Fati</div>';
  html += createChart(sortedAssessments.slice().reverse());
  html += "</div>";

  html += '<div class="history-list">';

  sortedAssessments.forEach((assessment, index) => {
    const date = new Date(assessment.date);
    const dateStr = date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeStr = date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    html += `
        <div class="history-item" onclick="viewAssessmentDetails(${appState.data.assessments.length - 1 - index})" role="button" tabindex="0" aria-label="Évaluation du ${escapeHtml(dateStr)}">
            <div class="history-header">
                <div class="history-date">${escapeHtml(dateStr)} à ${escapeHtml(timeStr)}</div>
                <div class="history-score">${assessment.totalScore}/40</div>
            </div>
            ${assessment.context ? `<div class="history-context">"${escapeHtml(assessment.context)}"</div>` : ""}
            <div class="history-priority">Priorité : ${escapeHtml(PRIORITY_LABELS[assessment.priority] || "Non définie")}</div>
        </div>
        `;
  });

  html += "</div>";

  historyContent.innerHTML = html;
}

export function createChart(assessments) {
  if (!assessments || assessments.length < 2) {
    return '<p class="chart-empty">Effectue au moins 2 évaluations pour voir ton évolution.</p>';
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
    <svg viewBox="0 0 100 ${height}" style="width: 100%; height: ${height}px; background: #f8f9fa; border-radius: 8px;" role="img" aria-label="Graphique d'évolution du score Amor Fati">
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
        <title>${p.date.toLocaleDateString("fr-FR")} : ${p.score}/40</title>
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
  if (el)
    el.textContent =
      PRIORITY_LABELS_FULL[appState.data.priority] || "Non définie";
}
