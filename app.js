// Application logic for AmorFati - extracted from inline script
const STORAGE_KEY = 'amorFatiData';

let appData = {
    priority: null,
    assessments: [],
    settings: { lastAssessment: null }
};

// Load and initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    displaySettings();
    displayHistory();

    // Wire navigation tabs
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.currentTarget.getAttribute('data-tab');
            switchTab(tab);
            document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });

    // Wire form submission
    const form = document.getElementById('assessmentForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            startAssessment(new FormData(form));
        });
    }

    // Wire export/import
    const importInput = document.getElementById('importInput');
    if (importInput) importInput.addEventListener('change', importData);

    // Wire other UI
    const resetBtn = document.getElementById('resetForm');
    if (resetBtn) resetBtn.addEventListener('click', resetForm);
});

// Switch visible tab
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const el = document.getElementById(tab);
    if (el) el.classList.add('active');
}

// Start assessment from FormData
function startAssessment(formData) {
    // build dimension scores from form using ASCII-safe field names
    const dims = [
        { label: 'Ressentiment', key: 'ressentiment' },
        { label: 'Souffrance présente', key: 'souffrance' },
        { label: 'Authenticité', key: 'authenticite' },
        { label: 'Création', key: 'creation' },
        { label: 'Éternel Retour', key: 'eternel' }
    ];
    const dimensionScores = {};
    let total = 0;
    dims.forEach(dim => {
        const value = parseInt(formData.get(dim.key) || '0', 10);
        dimensionScores[dim.label] = value;
        total += value;
    });

    const assessment = {
        date: new Date().toISOString(),
        dimensionScores,
        totalScore: total,
        context: formData.get('context') || '',
        priority: formData.get('priority') || null
    };

    appData.assessments.push(assessment);
    appData.settings.lastAssessment = assessment.date;
    saveData();

    displayResults(assessment);
    displayHistory();
    switchTab('assessment');
}

// Calculate and display results
function displayResults(assessment) {
    const results = document.getElementById('results');
    if (!results) return;

    let html = `<h3>Résultats - ${new Date(assessment.date).toLocaleString('fr-FR')}</h3>`;
    html += `<p>Score total : <strong>${assessment.totalScore}/40</strong></p>`;

    html += '<div class="dimension-scores">';
    for (const dim in assessment.dimensionScores) {
        const score = assessment.dimensionScores[dim];
        html += `
            <div class="dimension-score">
                <h4>${dim}</h4>
                <div class="dimension-score-value">${score}/8</div>
                <div class="score-bar"><div class="score-fill" style="width: ${(score/8)*100}%"></div></div>
            </div>
        `;
    }
    html += '</div>';

    html += '<h4>Recommandations</h4>';
    const recs = getRecommendations(assessment.dimensionScores, assessment.priority);
    html += '<ul class="recommendations">' + recs.map(r => `<li>${r}</li>`).join('') + '</ul>';

    html += '<h4>Comparaison</h4>';
    html += getEvolutionComparison();

    results.innerHTML = html;
    results.classList.add('show');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getRecommendations(dimensionScores, priority) {
    const recommendations = [];

    const mapping = {
        'Ressentiment': 'ressentiment',
        'Souffrance présente': 'souffrance',
        'Authenticité': 'authenticite',
        'Création': 'creation',
        'Éternel Retour': 'eternel'
    };

    let lowestDimension = null;
    let lowestScore = 9;
    for (const [dimension, score] of Object.entries(dimensionScores)) {
        if (score < lowestScore) {
            lowestScore = score;
            lowestDimension = mapping[dimension] || 'none';
        }
    }

    const priorityRecommendations = {
        'ressentiment': [
            "Écris une lettre (que tu n'enverras pas) à quelqu'un qui t'a fait du mal. Puis brûle-la symboliquement.",
            "Pratique l'exercice : 'Et si cette personne avait fait exactement ce qu'elle devait faire pour que je devienne qui je suis ?'",
            "Journal : chaque soir, note un événement passé douloureux et écris : 'Je dis oui à cette partie de mon histoire.'"
        ],
        'souffrance': [
            "Face à une difficulté cette semaine, demande-toi : 'Comment puis-je créer quelque chose à partir de cela ?'",
            "Pratique la distinction stoïcienne : liste ce qui dépend de toi vs ce qui n'en dépend pas.",
            "Méditation sur l'impermanence : tout passe, même cette souffrance. Peux-tu l'accepter le temps qu'elle dure ?"
        ],
        'authenticite': [
            "Identifie une décision que tu prends par peur du jugement. Peux-tu faire autrement cette semaine ?",
            "Liste 5 valeurs qui te définissent vraiment. Tes choix de vie les reflètent-ils ?",
            "Exercice : pendant une journée, observe combien de fois tu te censures ou joues un rôle."
        ],
        'creation': [
            "Remplace une heure de consommation par une heure de création (peu importe quoi).",
            "Face à un problème, demande-toi : 'Que puis-je créer à partir de cette contrainte ?'",
            "Lance un micro-projet créatif cette semaine, sans attendre qu'il soit parfait."
        ],
        'eternel': [
            "Pratique l'exercice de l'éternel retour : visualise ta vie qui se répète. Qu'est-ce qui te fait dire non ? Pourquoi ?",
            "Liste 3 aspects de ta vie que tu voudrais revivre éternellement. Puis 3 que tu refuserais. Explore le pourquoi.",
            "Chaque soir : 'Voudrais-je revivre cette journée éternellement ?' Si non, qu'est-ce qui devrait changer ?"
        ],
        'none': [
            "Observe simplement ton évolution sans te juger. Le chemin est aussi important que la destination.",
            "Concentre-toi sur ta dimension la plus faible (voir ci-dessus)."
        ]
    };

    if (priority && priorityRecommendations[priority]) {
        recommendations.push(...priorityRecommendations[priority]);
    }

    if (lowestDimension && lowestScore < 4) {
        recommendations.push(`<strong>Focus sur "${lowestDimension}"</strong> : C'est ta dimension la plus faible (${lowestScore}/8). C'est là que le travail aura le plus d'impact.`);
    }

    if (dimensionScores['Création'] < 4) {
        recommendations.push("Tu sembles plus dans la réaction que dans la création. Commence par 15 minutes de création par jour.");
    }

    return recommendations.slice(0, 5);
}

function getEvolutionComparison() {
    if (appData.assessments.length < 2) {
        return '<div class="alert alert-info">Continue à t\'évaluer régulièrement pour voir ton évolution dans le temps.</div>';
    }

    const current = appData.assessments[appData.assessments.length - 1];
    const previous = appData.assessments[appData.assessments.length - 2];

    const diff = current.totalScore - previous.totalScore;
    const diffText = diff > 0 ? `+${diff}` : diff;
    const diffColor = diff > 0 ? '#28a745' : (diff < 0 ? '#dc3545' : '#6c757d');
    const emoji = diff > 0 ? '📈' : (diff < 0 ? '📉' : '➡️');

    const previousDate = new Date(previous.date).toLocaleDateString('fr-FR');

    let html = `
        <div class="alert alert-info">
            <strong>${emoji} Évolution depuis le ${previousDate}</strong><br>
            Score précédent : ${previous.totalScore}/40<br>
            Score actuel : ${current.totalScore}/40<br>
            Évolution : <span style="color: ${diffColor}; font-weight: bold;">${diffText} points</span>
        </div>
    `;

    html += '<div style="margin-top: 15px;"><strong>Évolution par dimension :</strong></div>';
    html += '<div class="dimension-scores">';

    for (const dimension in current.dimensionScores) {
        const currentScore = current.dimensionScores[dimension];
        const previousScore = previous.dimensionScores[dimension] || 0;
        const dimDiff = currentScore - previousScore;
        const dimDiffText = dimDiff > 0 ? `+${dimDiff}` : dimDiff;
        const dimDiffColor = dimDiff > 0 ? '#28a745' : (dimDiff < 0 ? '#dc3545' : '#6c757d');

        html += `
            <div class="dimension-score">
                <h4>${dimension}</h4>
                <div class="dimension-score-value">${currentScore}/8 <span style="font-size: 0.8em; color: ${dimDiffColor};">(${dimDiffText})</span></div>
                <div class="score-bar">
                    <div class="score-fill" style="width: ${(currentScore / 8) * 100}%"></div>
                </div>
            </div>
        `;
    }

    html += '</div>';

    return html;
}

function displayHistory() {
    const historyContent = document.getElementById('historyContent');
    if (!historyContent) return;

    if (appData.assessments.length === 0) {
        historyContent.innerHTML = `
            <div class="history-empty">
                <h3>📊 Aucune évaluation pour le moment</h3>
                <p style="margin-top: 15px;">Commence ta première évaluation pour suivre ton évolution.</p>
                <button class="btn" onclick="switchTab('assessment'); document.querySelector('.nav-tab:nth-child(2)').click();">Faire une évaluation</button>
            </div>
        `;
        return;
    }

    const sortedAssessments = [...appData.assessments].sort((a, b) => new Date(b.date) - new Date(a.date));

    let html = '<div class="chart-container">';
    html += '<div class="chart-title">📈 Évolution de ton score Amor Fati</div>';
    html += createChart(sortedAssessments.slice().reverse());
    html += '</div>';

    html += '<div class="history-list">';

    sortedAssessments.forEach((assessment, index) => {
        const date = new Date(assessment.date);
        const dateStr = date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        const priorityLabels = {
            'ressentiment': '🔥 Passé & Ressentiment',
            'souffrance': '⚡ Souffrance présente',
            'authenticite': '🎭 Authenticité',
            'creation': '🎨 Création',
            'eternel': '♾️ Éternel Retour',
            'none': '🧭 Aucune priorité'
        };

        html += `
            <div class="history-item" onclick="viewAssessmentDetails(${appData.assessments.length - 1 - index})">
                <div class="history-header">
                    <div class="history-date">${dateStr} à ${timeStr}</div>
                    <div class="history-score">${assessment.totalScore}/40</div>
                </div>
                ${assessment.context ? `<div class="history-context">"${assessment.context}"</div>` : ''}
                <div class="history-priority">Priorité : ${priorityLabels[assessment.priority] || 'Non définie'}</div>
            </div>
        `;
    });

    html += '</div>';

    historyContent.innerHTML = html;
}

function createChart(assessments) {
    if (!assessments || assessments.length < 2) {
        return '<p style="text-align: center; color: #666;">Effectue au moins 2 évaluations pour voir ton évolution.</p>';
    }

    const width = 100;
    const height = 200;
    const padding = 30;
    const maxScore = 40;

    const points = assessments.map((a, i) => {
        const x = padding + (i / (assessments.length - 1)) * (100 - 2 * padding);
        const y = height - padding - ((a.totalScore / maxScore) * (height - 2 * padding));
        return { x, y, score: a.totalScore, date: new Date(a.date) };
    });

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        pathD += ` L ${points[i].x} ${points[i].y}`;
    }

    let svg = `
        <svg viewBox="0 0 100 ${height}" style="width: 100%; height: ${height}px; background: #f8f9fa; border-radius: 8px;">
            <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#ddd" stroke-width="0.5"/>
            <line x1="${padding}" y1="${height - padding}" x2="${100 - padding}" y2="${height - padding}" stroke="#ddd" stroke-width="0.5"/>

            ${[0,10,20,30,40].map(score => {
                const y = height - padding - ((score / maxScore) * (height - 2 * padding));
                return `\n                    <line x1="${padding}" y1="${y}" x2="${100 - padding}" y2="${y}" stroke="#e0e0e0" stroke-width="0.3" stroke-dasharray="2,2"/>\n                    <text x="${padding - 3}" y="${y + 1}" font-size="3" fill="#666" text-anchor="end">${score}</text>`;
            }).join('')}

            <path d="${pathD}" fill="none" stroke="url(#gradient)" stroke-width="1" stroke-linecap="round"/>

            ${points.map((p) => `\n                <circle cx="${p.x}" cy="${p.y}" r="1.5" fill="#667eea"/>\n                <title>${p.date.toLocaleDateString('fr-FR')} : ${p.score}/40</title>`).join('')}

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
    switchTab('assessment');
}

function displaySettings() {
    const priorityLabels = {
        'ressentiment': '🔥 Passé & Ressentiment - Me libérer du poids de mon passé',
        'souffrance': '⚡ Souffrance présente - Mieux accepter les difficultés actuelles',
        'authenticite': '🎭 Authenticité - Vivre selon mes propres valeurs',
        'creation': '🎨 Création - Devenir un créateur actif de ma vie',
        'eternel': '♾️ Éternel Retour - Affirmer totalement ma vie',
        'none': '🧭 Aucune priorité spécifique - Observer mon évolution globale'
    };

    const el = document.getElementById('currentPriority');
    if (el) el.textContent = priorityLabels[appData.priority] || 'Non définie';
}

function changePriority() {
    const newPriority = prompt(
        "Quelle dimension veux-tu prioriser ?\n\n" +
        "1 - Passé & Ressentiment\n" +
        "2 - Souffrance présente\n" +
        "3 - Authenticité\n" +
        "4 - Création\n" +
        "5 - Éternel Retour\n" +
        "6 - Aucune priorité\n\n" +
        "Entre le numéro (1-6) :"
    );

    const priorities = ['ressentiment', 'souffrance', 'authenticite', 'creation', 'eternel', 'none'];
    const index = parseInt(newPriority) - 1;

    if (index >= 0 && index < priorities.length) {
        appData.priority = priorities[index];
        saveData();
        displaySettings();
        alert('✅ Ta priorité a été mise à jour !');
    }
}

function resetForm() {
    const form = document.getElementById('assessmentForm');
    if (form) form.reset();
    document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
    const ctx = document.getElementById('contextNote');
    if (ctx) ctx.value = '';
    const results = document.getElementById('results');
    if (results) results.classList.remove('show');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function exportData() {
    const dataStr = JSON.stringify(appData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `amor-fati-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (!importedData.assessments || !Array.isArray(importedData.assessments)) {
                throw new Error('Format de fichier invalide');
            }
            if (confirm(`Voulez-vous importer ${importedData.assessments.length} évaluation(s) ?\n\nCela remplacera vos données actuelles.`)) {
                appData = importedData;
                saveData();
                alert('✅ Données importées avec succès !');
                displayHistory();
                switchTab('history');
            }
        } catch (error) {
            alert('❌ Erreur lors de l\'import : ' + error.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function deleteAllData() {
    if (confirm('⚠️ Es-tu sûr(e) de vouloir supprimer TOUTES tes données ?\n\nCette action est irréversible !')) {
        if (confirm('Dernière confirmation : toutes tes évaluations seront perdues définitivement.')) {
            appData = { priority: null, assessments: [], settings: { lastAssessment: null } };
            saveData();
            alert('✅ Toutes les données ont été supprimées.');
            switchTab('welcome');
        }
    }
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    } catch (e) {
        console.error('Erreur de sauvegarde:', e);
        alert('⚠️ Erreur lors de la sauvegarde des données.');
    }
}

function loadData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            appData = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Erreur de chargement:', e);
    }
}

// Service Worker registration (relative path)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => {
                console.log('Service Worker registered.', reg);
                if (reg.waiting) {
                    notifyUpdateReady(reg);
                }
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                notifyUpdateReady(reg);
                            }
                        }
                    });
                });
            })
            .catch(err => {
                console.error('Service Worker registration failed:', err);
            });
    });
}

function notifyUpdateReady(reg) {
    const banner = document.getElementById('updateBanner');
    const reloadBtn = document.getElementById('updateReload');
    const dismissBtn = document.getElementById('updateDismiss');
    if (!banner) return;
    banner.style.display = 'block';

    reloadBtn && (reloadBtn.onclick = () => {
        if (!reg || !reg.waiting) return;
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    });

    dismissBtn && (dismissBtn.onclick = () => {
        banner.style.display = 'none';
    });
}

// When new SW takes control, reload
if (navigator.serviceWorker && navigator.serviceWorker.addEventListener) {
    navigator.serviceWorker.addEventListener('controllerchange', function() {
        window.location.reload();
    });
}
