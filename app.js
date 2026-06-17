// ========================================
// AmorFati - Application Logic (ES Module)
// ========================================

import {
  STORAGE_KEY,
  PRIORITY_LABELS,
  PRIORITY_LABELS_FULL,
  DIMENSIONS,
  getInterpretation,
  getRecommendations,
  escapeHtml,
  DEFAULT_DATA,
  validateAppData,
  migrateData,
  CURRENT_SCHEMA_VERSION,
  mergeAssessments,
  LocalStorageRepository,
  QUESTIONS,
  DIMENSION_INFO,
} from "./src/logic.js";

let appData = structuredClone(DEFAULT_DATA);

let deferredPrompt;

import {
  openModal,
  showAlert,
  showConfirm,
  showDangerConfirm,
} from "./src/ui/modal.js";

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
      <input type="radio" name="modalPriority" value="${p.key}"${appData.priority === p.key ? " checked" : ""} />
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
      appData.priority = selected.value;
      saveData();
      displaySettings();
      await showAlert("✅ Ta priorité a été mise à jour !");
    }
  }

  return result;
}

// ========================================
// Assessment Form Rendering
// ========================================

function renderAssessmentForm() {
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
// Initialization
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  renderAssessmentForm();
  loadData();
  displaySettings();
  displayHistory();

  // Wire option selection (radio buttons in assessment form)
  document.querySelectorAll(".option").forEach((option) => {
    option.addEventListener("click", function () {
      const radio = this.querySelector('input[type="radio"]');
      const name = radio.name;
      document.querySelectorAll(`input[name="${name}"]`).forEach((r) => {
        r.parentElement.classList.remove("selected");
      });
      radio.checked = true;
      this.classList.add("selected");
    });
  });

  // Wire priority selection
  document.querySelectorAll(".priority-option").forEach((option) => {
    option.addEventListener("click", function () {
      const radio = this.querySelector('input[type="radio"]');
      document.querySelectorAll(".priority-option").forEach((opt) => {
        opt.classList.remove("selected");
      });
      radio.checked = true;
      this.classList.add("selected");
    });
  });

  // Wire import file input
  const importInput = document.getElementById("importFile");
  if (importInput) importInput.addEventListener("change", importData);

  // Wire modal priority option selection
  document.addEventListener("click", (e) => {
    const option = e.target.closest(".modal-priority-option");
    if (option) {
      const radio = option.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        document
          .querySelectorAll(".modal-priority-option")
          .forEach((opt) => opt.classList.remove("selected"));
        option.classList.add("selected");
      }
    }
  });

  // Keyboard navigation for tabs
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.addEventListener("keydown", handleTabKeydown);
  });
});

// ========================================
// Tab Keyboard Navigation
// ========================================

function handleTabKeydown(e) {
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

// ========================================
// Expose functions to global scope for onclick handlers
// ========================================

window.switchTab = switchTab;
window.startAssessment = startAssessment;
window.calculateResults = calculateResults;
window.resetForm = resetForm;
window.exportData = exportData;
window.deleteAllData = deleteAllData;
window.changePriority = changePriority;
window.installApp = installApp;
window.dismissInstall = dismissInstall;
window.viewAssessmentDetails = viewAssessmentDetails;

// ========================================
// PWA Install
// ========================================

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const prompt = document.getElementById("installPrompt");
  if (prompt) prompt.classList.add("show");
});

function installApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      deferredPrompt = null;
      dismissInstall();
    });
  }
}

function dismissInstall() {
  const prompt = document.getElementById("installPrompt");
  if (prompt) prompt.classList.remove("show");
}

// ========================================
// Tab Navigation
// ========================================

function switchTab(tabName) {
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

// ========================================
// Assessment
// ========================================

async function startAssessment() {
  const selectedPriority = document.querySelector(
    'input[name="priority"]:checked',
  );
  if (!selectedPriority) {
    await showAlert("Merci de sélectionner une priorité avant de commencer.");
    return;
  }

  appData.priority = selectedPriority.value;
  saveData();
  switchTab("assessment");
}

async function calculateResults() {
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
      `Merci de répondre à toutes les questions (${answeredQuestions}/${totalQuestions} répondues)`,
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
    priority: appData.priority,
  };

  appData.assessments.push(assessment);
  appData.settings.lastAssessment = assessment.date;
  saveData();

  // Display results
  displayResults(assessment);

  // Scroll to results
  document.getElementById("results").scrollIntoView({ behavior: "smooth" });
}

// ========================================
// Results Display
// ========================================

function displayResults(assessment) {
  const resultsDiv = document.getElementById("results");
  if (!resultsDiv) return;

  const interpretation = getInterpretation(assessment.totalScore);
  const recommendations = getRecommendations(
    assessment.dimensionScores,
    appData.priority,
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

function getEvolutionComparison() {
  if (appData.assessments.length < 2) {
    return '<div class="alert alert-info" role="status">Continue à t\'évaluer régulièrement pour voir ton évolution dans le temps.</div>';
  }

  const current = appData.assessments[appData.assessments.length - 1];
  const previous = appData.assessments[appData.assessments.length - 2];

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

function displayHistory() {
  const historyContent = document.getElementById("historyContent");
  if (!historyContent) return;

  if (appData.assessments.length === 0) {
    historyContent.innerHTML = `
        <div class="history-empty">
            <h3>📊 Aucune évaluation pour le moment</h3>
            <p>Commence ta première évaluation pour suivre ton évolution.</p>
            <button class="btn" onclick="switchTab('assessment')">Faire une évaluation</button>
        </div>
        `;
    return;
  }

  const sortedAssessments = [...appData.assessments].sort(
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
        <div class="history-item" onclick="viewAssessmentDetails(${appData.assessments.length - 1 - index})" role="button" tabindex="0" aria-label="Évaluation du ${escapeHtml(dateStr)}">
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

function createChart(assessments) {
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

function viewAssessmentDetails(index) {
  const assessment = appData.assessments[index];
  if (!assessment) return;
  displayResults(assessment);
  switchTab("assessment");
}

// ========================================
// Settings
// ========================================

function displaySettings() {
  const el = document.getElementById("currentPriority");
  if (el)
    el.textContent = PRIORITY_LABELS_FULL[appData.priority] || "Non définie";
}

async function changePriority() {
  await showPrioritySelector();
}

// ========================================
// Form Management
// ========================================

function resetForm() {
  const form = document.getElementById("assessmentForm");
  if (form) form.reset();
  document
    .querySelectorAll(".option")
    .forEach((opt) => opt.classList.remove("selected"));
  const ctx = document.getElementById("contextNote");
  if (ctx) ctx.value = "";
  const results = document.getElementById("results");
  if (results) results.classList.remove("show");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ========================================
// Data Management
// ========================================

function exportData() {
  const dataStr = storage.exportJSON(appData);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `amor-fati-export-${new Date().toISOString().split("T")[0]}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function importData(event) {
  const file = event.target.files ? event.target.files[0] : null;
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (e) {
    try {
      const importedData = JSON.parse(e.target.result);

      // Validate structure
      if (
        !importedData.assessments ||
        !Array.isArray(importedData.assessments)
      ) {
        throw new Error("Format de fichier invalide");
      }

      // Validate each assessment
      for (const a of importedData.assessments) {
        if (
          typeof a.date !== "string" ||
          typeof a.totalScore !== "number" ||
          typeof a.dimensionScores !== "object"
        ) {
          throw new Error("Données d'évaluation invalides dans le fichier");
        }
      }

      const count = importedData.assessments.length;
      const existingCount = appData.assessments.length;

      const choice = await openModal(
        `📥 Importer ${count} évaluation(s)`,
        `<p>Comment souhaites-tu importer les données ?</p>
         <p><strong>Remplacer</strong> : les données actuelles (${existingCount} évaluation(s)) seront supprimées.<br>
         <strong>Fusionner</strong> : les évaluations importées seront ajoutées aux existantes (les doublons sont ignorés).</p>`,
        [
          { label: "Annuler", value: null, class: "btn-secondary" },
          { label: "Fusionner", value: "merge", class: "" },
          { label: "Remplacer", value: "replace", class: "btn-danger" },
        ],
      );

      if (choice === "replace") {
        appData = importedData;
        appData.version = CURRENT_SCHEMA_VERSION;
        saveData();
        await showAlert("✅ Données importées avec succès (remplacement) !");
        displayHistory();
        switchTab("history");
      } else if (choice === "merge") {
        const merged = mergeAssessments(
          appData.assessments,
          importedData.assessments,
        );
        appData.assessments = merged;
        appData.version = CURRENT_SCHEMA_VERSION;
        saveData();
        await showAlert(`✅ ${merged.length} évaluation(s) après fusion !`);
        displayHistory();
        switchTab("history");
      }
    } catch (error) {
      await showAlert("❌ Erreur lors de l'import : " + error.message, {
        title: "Erreur",
      });
    }
  };
  reader.readAsText(file);
  // Reset file input
  event.target.value = "";
}

async function deleteAllData() {
  const firstConfirm = await showDangerConfirm(
    "Es-tu sûr(e) de vouloir supprimer TOUTES tes données ?<br><br>Cette action est irréversible !",
  );

  if (!firstConfirm) return;

  const secondConfirm = await showDangerConfirm(
    "Dernière confirmation : toutes tes évaluations seront perdues définitivement.",
  );

  if (secondConfirm) {
    appData = structuredClone(DEFAULT_DATA);
    saveData();
    await showAlert("✅ Toutes les données ont été supprimées.");
    switchTab("welcome");
  }
}

const storage = new LocalStorageRepository(STORAGE_KEY);

function saveData() {
  try {
    storage.save(appData);
  } catch (e) {
    console.error("Erreur de sauvegarde:", e);
    showAlert("⚠️ Erreur lors de la sauvegarde des données.", {
      title: "Erreur",
    });
  }
}

function loadData() {
  try {
    const stored = storage.load();
    if (!stored) return;

    const migrated = migrateData(stored);
    const validated = validateAppData(migrated);

    const originalCount = stored.assessments ? stored.assessments.length : 0;
    if (validated.assessments.length !== originalCount) {
      console.warn(
        `loadData: filtered out ${originalCount - validated.assessments.length} invalid assessment(s).`,
      );
    }

    appData = validated;
  } catch (e) {
    console.error("Erreur de chargement:", e);
    appData = structuredClone(DEFAULT_DATA);
  }
}

// ========================================
// Service Worker Registration
// ========================================

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const isGitHubPages = location.hostname.includes("github.io");
    const scope = isGitHubPages ? "/AmorFati/" : "/";

    navigator.serviceWorker
      .register("service-worker.js", { scope })
      .then((reg) => {
        console.log("✅ ServiceWorker enregistré:", reg.scope);

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          console.log("🔄 Mise à jour du SW détectée");

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                console.log("✨ Nouvelle version disponible");
                showConfirm(
                  "Une nouvelle version est disponible. Recharger maintenant ?",
                  { title: "✨ Mise à jour disponible" },
                ).then((confirmed) => {
                  if (confirmed) {
                    newWorker.postMessage({ type: "SKIP_WAITING" });
                  }
                });
              } else {
                console.log("✅ SW installé pour la première fois");
              }
            }
          });
        });
      })
      .catch((err) => {
        console.warn("⚠️ Erreur ServiceWorker:", err);
      });

    // Listen for SW messages
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "RELOAD_PAGE") {
        window.location.reload();
      }
    });
  });
}
