#!/bin/bash

# Script de correction automatique des pages
# Ajoute le fond animé et corrige la structure

PAGES_DIR="/home/user/Projet_Blocus/pages/app"

echo "🔧 CORRECTION AUTOMATIQUE DES PAGES"
echo "===================================="
echo ""

fix_background() {
    local file=$1
    local filename=$(basename "$file")

    # Vérifier si le fichier a déjà le fond animé
    if ! grep -q "noise-overlay" "$file"; then
        echo "  📝 Ajout du fond animé à $filename"

        # Trouver la ligne après <body
        local body_line=$(grep -n "<body" "$file" | head -1 | cut -d: -f1)

        if [ -n "$body_line" ]; then
            # Insérer le fond animé après la balise body
            sed -i "${body_line}a\\
\\
    <!-- FOND ANIMÉ -->\\
    <div class=\"noise-overlay\"></div>\\
    <div class=\"glow-bg\" style=\"top: -20%; left: -10%; background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);\"></div>\\
    <div class=\"glow-bg\" style=\"bottom: -20%; right: -10%; background: radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%);\"></div>" "$file"
        fi
    fi
}

# Pages qui ont besoin du fond animé
PAGES_NEEDING_BG=(
    "analytics.html"
    "flashcards.html"
    "search.html"
)

for page in "${PAGES_NEEDING_BG[@]}"; do
    file="$PAGES_DIR/$page"
    if [ -f "$file" ]; then
        echo "🔍 Traitement de $page"
        fix_background "$file"
        echo "  ✅ Terminé"
        echo ""
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Corrections terminées !"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
