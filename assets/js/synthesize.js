// ✅ PURE SUPABASE - Pas de wrappers Firestore
import { supabase } from './supabase-config.js';
import { initLayout } from './layout.js';
import { showMessage, formatDate } from './utils.js';
import { initSpeedInsights } from './speed-insights.js';

// Initialize Speed Insights for performance monitoring
initSpeedInsights();

// ===================================================================
// FONCTIONS DE FORMATAGE
// ===================================================================

/**
 * Formate les flashcards avec design moderne et animations avancées
 */
function formatFlashcards(content) {
    const lines = content.split('\n');
    let html = '<div class="flashcards-modern-container">';
    let currentLevel = null;
    let currentQuestion = null;
    let cardIndex = 0;

    for (const line of lines) {
        const trimmed = line.trim();

        // Gérer les niveaux de difficulté
        if (trimmed.startsWith('[🟢 FACILE]') || trimmed.startsWith('[🟡 MOYEN]') || trimmed.startsWith('[🔴 DIFFICILE]')) {
            currentLevel = trimmed;
            continue;
        }

        if (trimmed.startsWith('Q:') && currentQuestion === null) {
            currentQuestion = trimmed.substring(2).trim();
        } else if (trimmed.startsWith('R:') && currentQuestion !== null) {
            const answer = trimmed.substring(2).trim();
            cardIndex++;
            
            // Déterminer le thème visuel selon le niveau
            let theme = {
                easy: {
                    bgFront: 'from-emerald-400 via-teal-500 to-cyan-600',
                    bgBack: 'from-emerald-500 via-teal-600 to-cyan-700',
                    glowColor: 'emerald',
                    levelColor: 'text-emerald-400',
                    levelBg: 'bg-emerald-500/20',
                    borderColor: 'border-emerald-400/30',
                    icon: '🟢',
                    levelText: 'FACILE',
                    particleColor: '#10b981'
                },
                medium: {
                    bgFront: 'from-amber-400 via-orange-500 to-yellow-600',
                    bgBack: 'from-amber-500 via-orange-600 to-yellow-700',
                    glowColor: 'amber',
                    levelColor: 'text-amber-400',
                    levelBg: 'bg-amber-500/20',
                    borderColor: 'border-amber-400/30',
                    icon: '🟡',
                    levelText: 'MOYEN',
                    particleColor: '#f59e0b'
                },
                hard: {
                    bgFront: 'from-rose-400 via-pink-500 to-red-600',
                    bgBack: 'from-rose-500 via-pink-600 to-red-700',
                    glowColor: 'rose',
                    levelColor: 'text-rose-400',
                    levelBg: 'bg-rose-500/20',
                    borderColor: 'border-rose-400/30',
                    icon: '🔴',
                    levelText: 'DIFFICILE',
                    particleColor: '#f43f5e'
                }
            };

            let selectedTheme = theme.easy;
            if (currentLevel?.includes('🟡')) selectedTheme = theme.medium;
            else if (currentLevel?.includes('🔴')) selectedTheme = theme.hard;

            html += `
                <div class="modern-flashcard-wrapper mb-8">
                    <!-- Niveau de difficulté -->
                    <div class="difficulty-badge ${selectedTheme.levelBg} ${selectedTheme.borderColor} border rounded-full px-4 py-2 inline-flex items-center gap-2 mb-4 backdrop-blur-sm">
                        <span class="text-lg">${selectedTheme.icon}</span>
                        <span class="${selectedTheme.levelColor} font-bold text-sm">${selectedTheme.levelText}</span>
                        <div class="w-2 h-2 ${selectedTheme.levelColor} rounded-full animate-pulse"></div>
                    </div>
                    
                    <!-- Flashcard 3D -->
                    <div class="flashcard-3d-container" style="--card-index: ${cardIndex}; --glow-color: ${selectedTheme.particleColor};">
                        <div class="flashcard-3d-card" onclick="flipCard(this)">
                            <!-- Particules flottantes -->
                            <div class="floating-particles">
                                ${[...Array(6)].map((_, i) => `
                                    <div class="particle" style="--delay: ${i * 0.2}s; --duration: ${3 + i}s; --size: ${2 + i * 0.5}px;"></div>
                                `).join('')}
                            </div>
                            
                            <!-- Face avant (Question) -->
                            <div class="card-face card-front bg-gradient-to-br ${selectedTheme.bgFront}">
                                <div class="card-content">
                                    <div class="card-header">
                                        <div class="card-icon-wrapper">
                                            <div class="card-icon">
                                                <svg class="w-8 h-8 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                </svg>
                                            </div>
                                            <div class="glow-ring"></div>
                                        </div>
                                        <div class="card-label">QUESTION</div>
                                    </div>
                                    
                                    <div class="card-question">
                                        <p class="text-white text-xl font-medium leading-relaxed">${escapeHtml(currentQuestion)}</p>
                                    </div>
                                    
                                    <div class="card-hint">
                                        <div class="hint-content">
                                            <svg class="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                                            </svg>
                                            <span class="text-sm">Cliquez pour retourner</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Effet de brillance -->
                                <div class="card-shine"></div>
                            </div>
                            
                            <!-- Face arrière (Réponse) -->
                            <div class="card-face card-back bg-gradient-to-br ${selectedTheme.bgBack}">
                                <div class="card-content">
                                    <div class="card-header">
                                        <div class="card-icon-wrapper">
                                            <div class="card-icon">
                                                <svg class="w-8 h-8 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                </svg>
                                            </div>
                                            <div class="glow-ring"></div>
                                        </div>
                                        <div class="card-label">RÉPONSE</div>
                                    </div>
                                    
                                    <div class="card-answer">
                                        <p class="text-white text-lg leading-relaxed">${escapeHtml(answer)}</p>
                                    </div>
                                    
                                    <div class="card-actions">
                                        <button class="action-btn" onclick="event.stopPropagation(); markAsKnown(this)">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                            </svg>
                                            <span>Maîtrisé</span>
                                        </button>
                                        <button class="action-btn" onclick="event.stopPropagation(); markAsDifficult(this)">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                            </svg>
                                            <span>À revoir</span>
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Effet de brillance -->
                                <div class="card-shine"></div>
                            </div>
                        </div>
                    </div>
                </div>`;
            currentQuestion = null;
        }
    }

    html += '</div>';

    // Ajouter les styles CSS avancés
    html += `
    <style>
        .modern-flashcard-container {
            max-width: 100%;
            margin: 0 auto;
        }
        
        .flashcard-3d-container {
            perspective: 2000px;
            margin: 20px 0;
        }
        
        .flashcard-3d-card {
            position: relative;
            width: 100%;
            height: 320px;
            cursor: pointer;
            transform-style: preserve-3d;
            transition: transform 0.8s cubic-bezier(0.4, 0.0, 0.2, 1);
            border-radius: 24px;
        }
        
        .flashcard-3d-card.flipped {
            transform: rotateY(180deg);
        }
        
        .flashcard-3d-card:hover {
            transform: translateY(-8px) rotateY(var(--rotation, 0deg));
        }
        
        .flashcard-3d-card.flipped:hover {
            transform: translateY(-8px) rotateY(calc(180deg + var(--rotation, 0deg)));
        }
        
        .card-face {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            border-radius: 24px;
            padding: 2px;
            background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
            box-shadow: 
                0 20px 40px rgba(0,0,0,0.3),
                0 0 60px rgba(var(--glow-color), 0.3),
                inset 0 1px 0 rgba(255,255,255,0.2);
            overflow: hidden;
        }
        
        .card-back {
            transform: rotateY(180deg);
        }
        
        .card-content {
            position: relative;
            height: 100%;
            padding: 32px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: rgba(0,0,0,0.2);
            border-radius: 22px;
            backdrop-filter: blur(10px);
        }
        
        .card-header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 20px;
        }
        
        .card-icon-wrapper {
            position: relative;
            width: 56px;
            height: 56px;
        }
        
        .card-icon {
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,0.15);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .glow-ring {
            position: absolute;
            inset: -4px;
            background: linear-gradient(45deg, var(--glow-color), transparent, var(--glow-color));
            border-radius: 20px;
            opacity: 0.6;
            animation: rotate 3s linear infinite;
            z-index: -1;
        }
        
        .card-label {
            color: rgba(255,255,255,0.9);
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        
        .card-question, .card-answer {
            flex: 1;
            display: flex;
            align-items: center;
            padding: 20px 0;
        }
        
        .card-question p, .card-answer p {
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .card-hint {
            text-align: center;
            color: rgba(255,255,255,0.7);
        }
        
        .hint-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
        }
        
        .card-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            margin-top: 20px;
        }
        
        .action-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 20px;
            background: rgba(255,255,255,0.15);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 12px;
            color: white;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }
        
        .action-btn:hover {
            background: rgba(255,255,255,0.25);
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(0,0,0,0.2);
        }
        
        .card-shine {
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(
                45deg,
                transparent 30%,
                rgba(255,255,255,0.1) 50%,
                transparent 70%
            );
            transform: rotate(45deg);
            transition: all 0.6s ease;
            opacity: 0;
        }
        
        .flashcard-3d-card:hover .card-shine {
            animation: shine 0.6s ease-in-out;
        }
        
        .floating-particles {
            position: absolute;
            inset: 0;
            pointer-events: none;
            overflow: hidden;
        }
        
        .particle {
            position: absolute;
            background: var(--glow-color);
            border-radius: 50%;
            opacity: 0.3;
            animation: float var(--duration) ease-in-out infinite;
            animation-delay: var(--delay);
        }
        
        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        @keyframes shine {
            0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateX(100%) translateY(100%) rotate(45deg); opacity: 0; }
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            25% { transform: translateY(-20px) translateX(10px); }
            50% { transform: translateY(10px) translateX(-10px); }
            75% { transform: translateY(-10px) translateX(20px); }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .flashcard-3d-card {
                height: 280px;
            }
            
            .card-content {
                padding: 24px;
            }
            
            .card-question p, .card-answer p {
                font-size: 16px;
            }
            
            .card-actions {
                flex-direction: column;
            }
            
            .action-btn {
                width: 100%;
                justify-content: center;
            }
        }
    </style>`;

    return html;
}

/**
 * Formate le markdown avec design moderne et animations avancées
 */
function formatMarkdown(content) {
    let html = content;

    // Titres avec design moderne
    html = html.replace(/^### (.+)$/gm, 
        '<div class="modern-header level-3">' +
        '<div class="header-decoration"></div>' +
        '<h3 class="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mt-8 mb-4">$1</h3>' +
        '</div>');
    
    html = html.replace(/^## (.+)$/gm, 
        '<div class="modern-header level-2">' +
        '<div class="header-decoration"></div>' +
        '<h2 class="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mt-10 mb-6">$1</h2>' +
        '</div>');
    
    html = html.replace(/^# (.+)$/gm, 
        '<div class="modern-header level-1">' +
        '<div class="header-decoration"></div>' +
        '<h1 class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mt-12 mb-8">$1</h1>' +
        '</div>');

    // Gras et italique avec style moderne
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold bg-gradient-to-r from-yellow-400/20 to-orange-400/20 px-2 py-1 rounded-lg border border-yellow-400/30">$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em class="text-gray-300 italic bg-gradient-to-r from-blue-400/10 to-purple-400/10 px-1 py-0.5 rounded border-l-2 border-blue-400/30">$1</em>');

    // Points d'approfondissement avec design moderne
    html = html.replace(/❓\*\*Question de compréhension\*\* : (.+)/g, 
        '<div class="modern-interactive-block comprehension-block">' +
        '<div class="block-header">' +
        '<div class="block-icon-wrapper bg-blue-500/20 border border-blue-400/30">' +
        '<svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>' +
        '</svg>' +
        '</div>' +
        '<div class="block-title">Question de compréhension</div>' +
        '</div>' +
        '<div class="block-content">' +
        '<p class="text-gray-200 mb-4">$1</p>' +
        '<button class="modern-action-btn primary" onclick="toggleAnswer(this)">' +
        '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>' +
        '</svg>' +
        '<span>Voir l\'explication</span>' +
        '</button>' +
        '<div class="answer-content hidden">' +
        '<div class="loading-spinner">' +
        '<svg class="w-6 h-6 animate-spin text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>' +
        '</svg>' +
        '<span>Génération de l\'explication...</span>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>');

    // Suggestions d'approfondissement
    html = html.replace(/💡\*\*Pour approfondir\*\* : (.+)/g,
        '<div class="modern-interactive-block deepen-block">' +
        '<div class="block-header">' +
        '<div class="block-icon-wrapper bg-green-500/20 border border-green-400/30">' +
        '<svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>' +
        '</svg>' +
        '</div>' +
        '<div class="block-title">Pour approfondir</div>' +
        '</div>' +
        '<div class="block-content">' +
        '<p class="text-gray-200 mb-4">$1</p>' +
        '<button class="modern-action-btn secondary" onclick="exploreTopic(this)">' +
        '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>' +
        '</svg>' +
        '<span>Explorer ce sujet</span>' +
        '</button>' +
        '</div>' +
        '</div>');

    // Exercices pratiques
    html = html.replace(/🎯\*\*Exercice pratique\*\* : (.+)/g,
        '<div class="modern-interactive-block exercise-block">' +
        '<div class="block-header">' +
        '<div class="block-icon-wrapper bg-orange-500/20 border border-orange-400/30">' +
        '<svg class="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>' +
        '</svg>' +
        '</div>' +
        '<div class="block-title">Exercice pratique</div>' +
        '</div>' +
        '<div class="block-content">' +
        '<p class="text-gray-200 mb-4">$1</p>' +
        '<button class="modern-action-btn accent" onclick="showSolution(this)">' +
        '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>' +
        '</svg>' +
        '<span>Voir la solution</span>' +
        '</button>' +
        '<div class="solution-content hidden"></div>' +
        '</div>' +
        '</div>');

    // Auto-évaluation moderne
    html = html.replace(/🔄\*\*AUTO-ÉVALUATION\*\*([\s\S]*?)(?=❓|💡|🎯|$)/g,
        '<div class="modern-evaluation-block">' +
        '<div class="evaluation-header">' +
        '<div class="evaluation-icon-wrapper">' +
        '<svg class="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>' +
        '</svg>' +
        '</div>' +
        '<div class="evaluation-title">Auto-évaluation</div>' +
        '<div class="progress-indicator">' +
        '<div class="progress-bar-bg">' +
        '<div class="progress-bar-fill" style="width: 0%"></div>' +
        '</div>' +
        '<span class="progress-text">0%</span>' +
        '</div>' +
        '</div>' +
        '<div class="evaluation-content">$1</div>' +
        '</div>');

    // Checkboxes d'auto-évaluation modernes
    html = html.replace(/- ✅ (.+)/g,
        '<label class="modern-checkbox-label">' +
        '<div class="checkbox-wrapper">' +
        '<input type="checkbox" class="modern-checkbox" onchange="updateProgress()">' +
        '<div class="checkbox-custom">' +
        '<svg class="checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>' +
        '</svg>' +
        '</div>' +
        '</div>' +
        '<span class="checkbox-text">$1</span>' +
        '</label>');

    // Listes à puces modernes
    html = html.replace(/^- (.+)$/gm, 
        '<div class="modern-list-item">' +
        '<div class="list-marker">' +
        '<div class="marker-dot"></div>' +
        '</div>' +
        '<span class="list-text">$1</span>' +
        '</div>');

    // Lignes avec émojis spéciaux
    html = html.replace(/^📍 (.+)$/gm, 
        '<div class="special-point location-point">' +
        '<div class="point-icon">📍</div>' +
        '<div class="point-text bg-purple-500/10 border-l-4 border-purple-400 pl-4 py-2">$1</div>' +
        '</div>');
    
    html = html.replace(/^• (.+)$/gm, 
        '<div class="special-point bullet-point">' +
        '<div class="point-icon">•</div>' +
        '<div class="point-text bg-gray-700/30 rounded-lg px-4 py-2">$1</div>' +
        '</div>');
    
    html = html.replace(/^🌟 (.+)$/gm, 
        '<div class="special-point star-point">' +
        '<div class="point-icon">🌟</div>' +
        '<div class="point-text bg-yellow-500/10 border border-yellow-400/30 rounded-lg px-4 py-2">$1</div>' +
        '</div>');

    // Paragraphes modernes
    html = html.replace(/\n\n/g, '</p><p class="modern-paragraph text-gray-300 leading-relaxed mb-6">');
    html = '<p class="modern-paragraph text-gray-300 leading-relaxed mb-6">' + html + '</p>';

    return `<div class="modern-content-wrapper">${html}</div>`;
}

// Ajouter les fonctions interactives pour les points d'approfondissement
function addInteractiveFunctions() {
    if (window.toggleAnswer && window.exploreTopic && window.showSolution) return; // Déjà ajouté

    // Toggle pour les réponses aux questions
    window.toggleAnswer = function(element) {
        const answer = element.querySelector('.answer');
        if (answer.classList.contains('hidden')) {
            answer.classList.remove('hidden');
            answer.innerHTML = '<i class="fas fa-spinner fa-spin text-yellow-400 mr-2"></i>Génération de l\'explication...';
            
            // Simuler une génération d'explication (remplacer par vrai appel IA)
            setTimeout(() => {
                answer.innerHTML = '<i class="fas fa-lightbulb text-yellow-400 mr-2"></i>Voici une explication détaillée pour vous aider à mieux comprendre ce concept. [Cette fonctionnalité sera bientôt connectée à l\'IA pour des explications personnalisées]';
            }, 1500);
        } else {
            answer.classList.add('hidden');
        }
    };

    // Exploration de sujet
    // Afficher des tips d'étude pendant le chargement
function showStudyTip() {
    const tips = [
        "💡 Astuce : Prenez des notes manuscrites pour mieux mémoriser",
        "📚 Conseil : Révisez régulièrement plutôt qu'en une seule fois",
        "🧠 Méthode : Expliquez le concept à quelqu'un d'autre pour valider votre compréhension",
        "⏰ Technique : Utilisez la technique Pomodoro (25min travail, 5min pause)",
        "🎯 Objectif : Fixez-vous des objectifs d'apprentissage spécifiques et mesurables",
        "🔄 Répétition : Revoyez les informations après 1 jour, 3 jours, 1 semaine",
        "📝 Organisation : Créez des fiches de révision avec des mots-clés",
        "🎨 Visuel : Utilisez des schémas et couleurs pour mieux retenir",
        "🔊 Auditif : Lisez vos notes à voix haute pour renforcer la mémorisation",
        "🏃 Mouvement : Faites de courtes pauses pour marcher et oxygéner votre cerveau",
        "🎮 Gamification : Transformez l'apprentissage en jeu pour plus de motivation",
        "🤔 Questions : Testez-vous régulièrement avec des questions spontanées",
        "📖 Contexte : Reliez les nouvelles informations à ce que vous connaissez déjà",
        "⚡ Focus : Éliminez les distractions (téléphone, notifications) pendant l'étude",
        "🌙 Sommeil : Une bonne nuit de sommeil améliore la consolidation de la mémoire"
    ];
    
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    
    // Créer ou mettre à jour le conteneur de tips
    let tipContainer = document.getElementById('study-tip-container');
    if (!tipContainer) {
        tipContainer = document.createElement('div');
        tipContainer.id = 'study-tip-container';
        tipContainer.className = 'mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-300';
        const modalBody = document.querySelector('#new-synth-modal .p-6.overflow-y-auto');
        if (modalBody) {
            modalBody.appendChild(tipContainer);
        }
    }
    
    tipContainer.innerHTML = `
        <div class="flex items-start gap-2">
            <span class="text-green-400 mt-1">💡</span>
            <div>
                <div class="font-medium text-green-200 mb-1">Pendant que nous générons votre synthèse...</div>
                <div>${randomTip}</div>
            </div>
        </div>
    `;
}

window.exploreTopic = function(button) {
        const topic = button.parentElement.querySelector('.text-gray-300').textContent;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Recherche...';
        button.disabled = true;
        
        // Simuler une recherche (remplacer par vraie fonctionnalité)
        setTimeout(() => {
            button.innerHTML = '✓ Exploré';
            button.classList.add('bg-green-600');
            showMessage(`Suggestion enregistrée pour : "${topic}"`, 'success');
        }, 1000);
    };

    // Afficher les solutions
    window.showSolution = function(button) {
        const solutionDiv = button.nextElementSibling;
        if (solutionDiv.classList.contains('hidden')) {
            solutionDiv.classList.remove('hidden');
            solutionDiv.innerHTML = '<i class="fas fa-key text-orange-400 mr-2"></i>Solution détaillée : [Cette fonctionnalité sera bientôt connectée à l\'IA pour des solutions personnalisées]';
            button.innerHTML = 'Masquer la solution <i class="fas fa-eye-slash ml-1"></i>';
        } else {
            solutionDiv.classList.add('hidden');
            button.innerHTML = 'Voir la solution <i class="fas fa-eye ml-1"></i>';
        }
    };

    // Mise à jour du progrès
    window.updateProgress = function() {
        const checkboxes = document.querySelectorAll('.self-evaluation input[type="checkbox"]');
        const checked = document.querySelectorAll('.self-evaluation input[type="checkbox"]:checked');
        const progress = checkboxes.length > 0 ? Math.round((checked.length / checkboxes.length) * 100) : 0;
        
        // Mettre à jour une barre de progression si elle existe
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
            progressBar.textContent = `${progress}%`;
        }
        
        if (progress === 100 && checkboxes.length > 0) {
            showMessage('🎉 Félicitations ! Vous avez maîtrisé tous les points de ce chapitre !', 'success');
        }
    };
}

// Rendre les fonctions globales pour les flashcards
window.flipCard = function(card) {
    card.classList.toggle('flipped');
}

window.markAsKnown = function(btn) {
    btn.style.background = 'rgba(34, 197, 94, 0.3)';
    btn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg><span>Maîtrisé ✓</span>';
}

window.markAsDifficult = function(btn) {
    btn.style.background = 'rgba(239, 68, 68, 0.3)';
    btn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>À revoir ⚠️</span>';
}

/**
 * Échappe les caractères HTML pour éviter XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

let currentUserId = null;
let currentSynthId = null;

const ui = {
    dashboard: document.getElementById('synth-dashboard'),
    viewer: document.getElementById('synth-viewer'),
    grid: document.getElementById('synth-grid'),
    modal: document.getElementById('new-synth-modal'),
    viewTitle: document.getElementById('view-title'),
    viewMeta: document.getElementById('view-meta'),
    viewContent: document.getElementById('view-content'),
    viewBadge: document.getElementById('view-type-badge'),
    titleInput: document.getElementById('synth-title-input'),
    sourceRadios: document.getElementsByName('synth-source'),
    containers: {
        file: document.getElementById('source-file-container'),
        text: document.getElementById('source-text-container'),
        topic: document.getElementById('source-topic-container')
    },
    fileSelect: document.getElementById('synth-file-select'),
    textInput: document.getElementById('synth-text-input'),
    topicInput: document.getElementById('synth-topic-input'),
    formatSelect: document.getElementById('synth-format'),
    levelSelect: document.getElementById('synth-level'),
    lengthSelect: document.getElementById('synth-length'),
    loadingBar: document.getElementById('loading-bar-container'),
    btnOpenHero: document.getElementById('btn-new-synth-hero'),
    btnOpenHeader: document.getElementById('btn-new-synth-header'),
    btnCloseModal: document.getElementById('close-modal-btn'),
    btnCancel: document.getElementById('cancel-synth-btn'),
    btnGenerate: document.getElementById('generate-synth-btn'),
    btnCloseViewer: document.getElementById('close-viewer-btn'),
    btnPrint: document.getElementById('print-btn'),
    btnDelete: document.getElementById('delete-current-synth'),
    userName: document.getElementById('user-name-header'),
    userAvatar: document.getElementById('user-avatar-header'),
    notifBtn: document.getElementById('notif-btn'),
    notifBadge: document.getElementById('notif-badge'),
    notifDropdown: document.getElementById('notif-dropdown'),
    notifList: document.getElementById('notifications-list')
};

document.addEventListener('DOMContentLoaded', async () => {
    initLayout('synthesize');

    document.querySelectorAll('select').forEach(s => {
        s.addEventListener('change', () => s.value ? s.classList.add('has-value') : s.classList.remove('has-value'));
    });

    // ✅ PURE SUPABASE: Récupérer la session directement
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (session?.user) {
        currentUserId = session.user.id;
        await initPage();
        loadSyntheses();
        loadFiles();
        setupNotifications(currentUserId);
    } else {
        window.location.href = '../auth/login.html';
    }
});

async function initPage() {
    try {
        // ✅ PURE SUPABASE: Récupérer user directement avec snake_case
        const { data, error } = await supabase
            .from('users')
            .select('first_name, photo_url')
            .eq('id', currentUserId)
            .single();

        if (error) throw error;

        if (data) {
            if(ui.userName) ui.userName.textContent = data.first_name || "Étudiant";
            if(ui.userAvatar) ui.userAvatar.src = data.photo_url || 'https://ui-avatars.com/api/?background=random';
        }
    } catch(e) {
        // ✅ ERROR HANDLING: Log l'erreur (non bloquant pour l'UI)
        console.error('Erreur lors du chargement du profil utilisateur:', e);
    }
}

async function loadSyntheses() {
    // ✅ PURE SUPABASE: Query directe sans wrapper
    const { data: syntheses, error } = await supabase
        .from('syntheses')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erreur chargement synthèses:', error);
        ui.grid.innerHTML = `<div class="col-span-full py-12 text-center text-gray-500 opacity-50"><p>Erreur de chargement</p></div>`;
        return;
    }

    ui.grid.innerHTML = '';
    if (!syntheses || syntheses.length === 0) {
        ui.grid.innerHTML = `<div class="col-span-full py-12 text-center text-gray-500 opacity-50"><p>Aucune synthèse pour l'instant.</p></div>`;
        return;
    }

    syntheses.forEach(synth => {
        const dateStr = formatDate(synth.created_at);

        const card = document.createElement('div');
        card.className = 'synth-card content-glass rounded-2xl p-6 flex flex-col justify-between h-full relative group cursor-pointer border border-gray-800 hover:border-pink-500/30 transition-all';
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-4">
                    <div class="w-10 h-10 rounded-lg bg-pink-600/20 flex items-center justify-center text-pink-400">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <span class="px-2 py-1 rounded bg-gray-800 text-xs text-gray-400 border border-gray-700">${synth.format_label || 'Résumé'}</span>
                </div>
                <h3 class="font-bold text-white text-lg mb-2 line-clamp-2">${synth.title}</h3>
                <p class="text-xs text-gray-400 mb-1"><i class="far fa-clock mr-1"></i> ${dateStr}</p>
                <p class="text-xs text-gray-500 truncate">Source: ${synth.source_type}</p>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center text-xs text-pink-400 font-bold group-hover:text-pink-300">
                <span>Lire la fiche</span>
                <i class="fas fa-arrow-right"></i>
            </div>
        `;
        card.onclick = () => openViewer(synth.id, synth);
        ui.grid.appendChild(card);
    });
}

async function loadFiles() {
    // ✅ PURE SUPABASE: Query directe
    const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

    ui.fileSelect.innerHTML = '<option value="">-- Choisir un fichier --</option>';

    if (error) {
        console.error('Erreur chargement fichiers:', error);
        return;
    }

    if (courses) {
        courses.forEach(course => {
            const opt = document.createElement('option');
            opt.value = course.id;
            opt.text = course.title || course.file_name;
            ui.fileSelect.appendChild(opt);
        });
    }
}

function openViewer(id, synth) {
    currentSynthId = id;
    ui.dashboard.classList.add('hidden');
    ui.viewer.classList.remove('hidden');

    // ✅ PURE SUPABASE: Utiliser snake_case
    ui.viewTitle.textContent = synth.title;
    ui.viewBadge.textContent = (synth.format_label || 'RÉSUMÉ').toUpperCase();
    ui.viewMeta.textContent = `Généré le ${formatDate(synth.created_at)} • Source: ${synth.source_name || 'Inconnue'}`;

    // ✅ Formatter le contenu selon le type de synthèse
    const formatLabel = synth.format_label || '';
    if (formatLabel.toLowerCase().includes('flashcard')) {
        // Format flashcards Q:/R: en cartes visuelles avec niveaux
        ui.viewContent.innerHTML = formatFlashcards(synth.content || '');
    } else if (synth.content?.includes('<')) {
        // HTML formaté - sanitize
        if (typeof DOMPurify !== 'undefined') {
            ui.viewContent.innerHTML = DOMPurify.sanitize(synth.content);
        } else {
            ui.viewContent.textContent = synth.content;
        }
    } else {
        // Texte brut avec formatage markdown avancé et interactif
        ui.viewContent.innerHTML = formatMarkdown(synth.content || '');
        
        // Ajouter les fonctionnalités interactives
        addInteractiveFunctions();
    }

    // Ajouter une barre de progression pour l'auto-évaluation si présente
    if (synth.content?.includes('AUTO-ÉVALUATION')) {
        const progressHtml = `
            <div class="progress-container mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-gray-400">Progrès de maîtrise</span>
                    <span class="progress-bar text-xs text-purple-400 font-bold">0%</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2">
                    <div class="progress-bar bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
            </div>
        `;
        ui.viewContent.insertAdjacentHTML('afterbegin', progressHtml);
    }
}

ui.btnCloseViewer.onclick = () => {
    ui.viewer.classList.add('hidden');
    ui.dashboard.classList.remove('hidden');
};

ui.btnPrint.onclick = () => window.print();

ui.btnDelete.onclick = async () => {
    if(confirm("Supprimer cette synthèse ?")) {
        // ✅ PURE SUPABASE: Suppression directe
        const { error } = await supabase
            .from('syntheses')
            .delete()
            .eq('id', currentSynthId);

        if (error) {
            console.error('Erreur suppression:', error);
            showMessage("Erreur lors de la suppression", "error");
            return;
        }

        ui.viewer.classList.add('hidden');
        ui.dashboard.classList.remove('hidden');
        loadSyntheses();
        showMessage("Synthèse supprimée", "success");
    }
};

if (ui.btnGenerate) {
    ui.btnGenerate.onclick = async () => {
        const btn = ui.btnGenerate;
        const originalHtml = btn.innerHTML;
        const title = ui.titleInput.value.trim() || "Nouvelle Synthèse";
        const sourceElement = document.querySelector('input[name="synth-source"]:checked');

        if (!sourceElement) return showMessage("Sélectionnez une source", "error");
        const source = sourceElement.value;
        const format = ui.formatSelect.value;
        const level = ui.levelSelect.value;
        const length = ui.lengthSelect.value;

        let context = "";
        let sourceName = "";

        if (source === 'topic') {
            context = ui.topicInput.value.trim();
            sourceName = context;
            if (!context) return showMessage("Entrez un sujet", "error");
        } else if (source === 'text') {
            context = ui.textInput.value.trim();
            sourceName = "Texte collé";
            if (!context) return showMessage("Collez du texte", "error");
        } else {
            const sel = ui.fileSelect;
            if (!sel.value) return showMessage("Sélectionnez un fichier", "error");
            sourceName = sel.options[sel.selectedIndex].text;
            context = `Fichier intitulé : "${sourceName}". (Le contenu complet n'est pas encore accessible, baser sur le titre)`;
        }

        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Rédaction...`;
        ui.loadingBar.classList.remove('hidden');
        
        // Afficher un tip d'étude aléatoire
        showStudyTip();

        try {
            // ✅ Récupérer le token JWT pour l'authentification
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            console.log('🔍 === DEBUGGING JWT ===');
            console.log('📦 Session exists:', !!session);
            console.log('📦 Session error:', sessionError);

            if (session) {
                console.log('👤 User ID:', session.user?.id);
                console.log('📧 User email:', session.user?.email);
                console.log('🔑 Access token (first 20 chars):', session.access_token?.substring(0, 20) + '...');
                console.log('🔑 Token length:', session.access_token?.length);
                console.log('⏰ Token expires at:', new Date(session.expires_at * 1000).toLocaleString());
                console.log('⏰ Current time:', new Date().toLocaleString());
                console.log('⚠️ Token expired?', session.expires_at * 1000 < Date.now());
            }

            if (!session) {
                throw new Error('Non authentifié. Veuillez vous reconnecter.');
            }

            const requestBody = {
                mode: 'synthesis',
                topic: sourceName,
                data: context,
                options: {
                    format: format,
                    level: level,
                    length: length
                }
            };

            console.log('📤 Request body:', requestBody);

            // ✅ TEST: Utiliser ANON_KEY pour voir si le problème vient du user JWT
            const SUPABASE_URL = 'https://vhtzudbcfyxnwmpyjyqw.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZodHp1ZGJjZnl4bndtcHlqeXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NDY2NDgsImV4cCI6MjA4MjQyMjY0OH0.6tHA5qpktIqoLNh1RN620lSVhn6FRu3qtRI2O0j7mGU';

            console.log('🧪 TEST: Calling Edge Function with ANON_KEY (not user JWT)...');
            const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-synthesis`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify(requestBody)
            });

            console.log('📥 Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('🔴 Edge Function Error:', response.status, errorData);
                throw new Error(errorData.error || errorData.message || 'Erreur lors de la génération de la synthèse');
            }

            const data = await response.json();
            console.log('📥 Response data:', data);

            // Sauvegarder la synthèse dans la base de données
            const { error: insertError } = await supabase.from('syntheses').insert([{
                user_id: currentUserId,
                title: title,
                source_type: source,
                source_name: sourceName,
                format_label: ui.formatSelect.options[ui.formatSelect.selectedIndex].text,
                content: data.content
            }]);

            if (insertError) throw insertError;

            toggleModal(false);
            ui.titleInput.value = "";
            showMessage("Synthèse générée avec succès !", "success");
            loadSyntheses();

        } catch (e) {
            console.error(e);
            showMessage("Erreur : " + (e.message || "Une erreur est survenue"), "error");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
            ui.loadingBar.classList.add('hidden');
        }
    };
}

const toggleModal = (show) => ui.modal.classList.toggle('hidden', !show);
if(ui.btnOpenHero) ui.btnOpenHero.onclick = () => toggleModal(true);
if(ui.btnOpenHeader) ui.btnOpenHeader.onclick = () => toggleModal(true);
if(ui.btnCloseModal) ui.btnCloseModal.onclick = () => toggleModal(false);
if(ui.btnCancel) ui.btnCancel.onclick = () => toggleModal(false);

ui.sourceRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        Object.values(ui.containers).forEach(c => c.classList.add('hidden'));
        ui.containers[e.target.value].classList.remove('hidden');
    });
});

async function setupNotifications(userId) {
    // ✅ PURE SUPABASE: Query directe sans wrapper
    const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Erreur chargement notifications:', error);
        return;
    }

    if (notifications && notifications.length > 0) {
        ui.notifBadge.classList.remove('hidden');
        ui.notifList.innerHTML = notifications.map(n => `<div class="p-3 border-b border-gray-800 text-left text-sm text-gray-300">${n.message}</div>`).join('');
    } else {
        ui.notifBadge.classList.add('hidden');
    }

    // ✅ S'abonner aux changements en temps réel
    supabase
        .channel('notifications_changes')
        .on('postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                console.log('Notification changed:', payload);
                setupNotifications(userId); // Recharger
            }
        )
        .subscribe();
}
if(ui.notifBtn) ui.notifBtn.onclick = (e) => { e.stopPropagation(); ui.notifDropdown.classList.toggle('hidden'); };
window.onclick = (e) => { if(!ui.notifDropdown.contains(e.target) && !ui.notifBtn.contains(e.target)) ui.notifDropdown.classList.add('hidden'); };
