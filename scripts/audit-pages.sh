#!/bin/bash

# Script d'audit détaillé des pages HTML
# Vérifie chaque élément critique de chaque page

echo "🔍 AUDIT DÉTAILLÉ DES PAGES HTML"
echo "================================"
echo ""

PAGES_DIR="/home/user/Projet_Blocus/pages/app"
ERRORS=0
WARNINGS=0

# Couleurs
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

check_page() {
    local file=$1
    local filename=$(basename "$file")
    local issues=0

    echo "📄 Vérification de $filename"
    echo "---"

    # 1. Vérifier DOCTYPE
    if ! grep -q "<!DOCTYPE html>" "$file"; then
        echo -e "${RED}  ❌ Manque DOCTYPE${NC}"
        issues=$((issues+1))
    fi

    # 2. Vérifier charset
    if ! grep -q '<meta charset="UTF-8">' "$file"; then
        echo -e "${RED}  ❌ Manque charset UTF-8${NC}"
        issues=$((issues+1))
    fi

    # 3. Vérifier viewport
    if ! grep -q '<meta name="viewport"' "$file"; then
        echo -e "${RED}  ❌ Manque viewport${NC}"
        issues=$((issues+1))
    fi

    # 4. Vérifier favicon
    if ! grep -q "locus-neon-favicon.png" "$file"; then
        echo -e "${YELLOW}  ⚠️  Manque favicon${NC}"
        WARNINGS=$((WARNINGS+1))
    fi

    # 5. Vérifier style.css
    if ! grep -q "assets/css/style.css" "$file"; then
        echo -e "${RED}  ❌ Manque style.css${NC}"
        issues=$((issues+1))
    else
        # Vérifier si c'est un chemin relatif
        if grep -q 'href="/assets/css/style.css"' "$file"; then
            echo -e "${RED}  ❌ Chemin absolu style.css (doit être relatif)${NC}"
            issues=$((issues+1))
        fi
        # Vérifier doublons
        count=$(grep -c "assets/css/style.css" "$file")
        if [ "$count" -gt 1 ]; then
            echo -e "${YELLOW}  ⚠️  $count imports de style.css (doublon)${NC}"
            WARNINGS=$((WARNINGS+1))
        fi
    fi

    # 6. Vérifier Font Awesome
    if ! grep -q "font-awesome" "$file"; then
        echo -e "${YELLOW}  ⚠️  Manque Font Awesome${NC}"
        WARNINGS=$((WARNINGS+1))
    fi

    # 7. Vérifier CDN Tailwind (ne devrait PAS être là)
    if grep -q "cdn.tailwindcss.com" "$file"; then
        echo -e "${RED}  ❌ CDN Tailwind présent (à supprimer)${NC}"
        issues=$((issues+1))
    fi

    # 8. Vérifier app-container
    if ! grep -q 'id="app-container"' "$file"; then
        echo -e "${RED}  ❌ Manque id='app-container'${NC}"
        issues=$((issues+1))
    fi

    # 9. Vérifier fond animé
    if ! grep -q "noise-overlay" "$file"; then
        echo -e "${YELLOW}  ⚠️  Manque fond animé (noise-overlay)${NC}"
        WARNINGS=$((WARNINGS+1))
    fi

    # 10. Vérifier imports Firebase
    if ! grep -q "config.js" "$file"; then
        echo -e "${YELLOW}  ⚠️  Manque import config.js${NC}"
        WARNINGS=$((WARNINGS+1))
    fi

    # 11. Vérifier layout.js
    if ! grep -q "layout.js" "$file"; then
        echo -e "${YELLOW}  ⚠️  Manque import layout.js${NC}"
        WARNINGS=$((WARNINGS+1))
    fi

    # 12. Vérifier initLayout
    if ! grep -q "initLayout" "$file"; then
        echo -e "${YELLOW}  ⚠️  initLayout non appelé${NC}"
        WARNINGS=$((WARNINGS+1))
    fi

    # 13. Vérifier chemins absolus JS
    if grep -q 'src="/assets/' "$file"; then
        echo -e "${RED}  ❌ Chemins absolus JS détectés${NC}"
        issues=$((issues+1))
    fi

    if [ $issues -eq 0 ]; then
        echo -e "${GREEN}  ✅ Aucune erreur critique${NC}"
    else
        ERRORS=$((ERRORS+issues))
    fi

    echo ""
}

# Vérifier toutes les pages
for page in "$PAGES_DIR"/*.html; do
    check_page "$page"
done

# Résumé
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RÉSUMÉ DE L'AUDIT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "❌ Erreurs critiques : ${RED}$ERRORS${NC}"
echo -e "⚠️  Avertissements : ${YELLOW}$WARNINGS${NC}"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Aucune erreur critique !${NC}"
    exit 0
else
    echo -e "${RED}❌ Des erreurs doivent être corrigées${NC}"
    exit 1
fi
