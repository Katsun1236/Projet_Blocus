#!/bin/bash

# Script de vérification de la configuration des pages
# Usage: bash scripts/check-pages.sh

echo "🔍 Vérification de la configuration des pages..."
echo ""

ERRORS=0

# 1. Vérifier que toutes les pages utilisent style.css (pas output.css)
echo "📄 Vérification des imports CSS..."
OUTPUT_CSS_FILES=$(find pages -name "*.html" -type f -exec grep -l "output\.css" {} \;)
if [ -n "$OUTPUT_CSS_FILES" ]; then
    echo "❌ Pages utilisant encore output.css :"
    echo "$OUTPUT_CSS_FILES"
    ERRORS=$((ERRORS+1))
else
    echo "✅ Toutes les pages utilisent style.css"
fi
echo ""

# 2. Vérifier que les nouvelles pages ont bien le layout
echo "📱 Vérification de l'initialisation du layout..."
PAGES_WITH_LAYOUT=$(grep -l "initLayout" pages/app/*.html | wc -l)
JS_WITH_LAYOUT=$(grep -l "initLayout.*('.*')" assets/js/*.js | grep -v layout.js | wc -l)
echo "  - Pages HTML avec initLayout direct : $PAGES_WITH_LAYOUT"
echo "  - Fichiers JS avec initLayout : $JS_WITH_LAYOUT"

# Vérifier pages critiques
CRITICAL_PAGES=("analytics" "flashcards" "search" "quiz" "profile" "planning" "synthesize" "community")
echo ""
echo "  Vérification des pages critiques :"
for page in "${CRITICAL_PAGES[@]}"; do
    JS_FILE="assets/js/${page}.js"
    if [ -f "$JS_FILE" ]; then
        if grep -q "initLayout" "$JS_FILE"; then
            echo "    ✅ $page - Layout initialisé dans JS"
        else
            echo "    ❌ $page - Layout NON initialisé"
            ERRORS=$((ERRORS+1))
        fi
    else
        echo "    ⚠️  $page - Pas de fichier JS dédié"
    fi
done
echo ""

# 3. Vérifier les imports Firebase
echo "🔥 Vérification des imports Firebase..."
PAGES_WITHOUT_CONFIG=$(find pages/app -name "*.html" -type f ! -exec grep -q "config\.js" {} \; -print)
if [ -n "$PAGES_WITHOUT_CONFIG" ]; then
    echo "⚠️  Pages sans config.js :"
    echo "$PAGES_WITHOUT_CONFIG"
else
    echo "✅ Toutes les pages importent config.js"
fi
echo ""

# 4. Vérifier les chemins CSS relatifs vs absolus
echo "🎨 Vérification des chemins CSS..."
RELATIVE_CSS=$(grep -r "href=\"\.\./\.\./assets/css/style\.css\"" pages/app/*.html | wc -l)
ABSOLUTE_CSS=$(grep -r "href=\"/assets/css/style\.css\"" pages/app/*.html | wc -l)
echo "  - Chemins relatifs (../../) : $RELATIVE_CSS fichiers"
echo "  - Chemins absolus (/) : $ABSOLUTE_CSS fichiers"
if [ $RELATIVE_CSS -gt 0 ] && [ $ABSOLUTE_CSS -gt 0 ]; then
    echo "  ⚠️  Attention : mélange de chemins relatifs et absolus"
fi
echo ""

# 5. Vérifier les doublons de CSS
echo "🔍 Vérification des doublons CSS..."
FILES_WITH_DUPLICATE_CSS=$(grep -r "assets/css/style\.css" pages/app/*.html | sort | uniq -c | awk '$1 > 1 {print $2}' | cut -d: -f1 | sort -u)
if [ -n "$FILES_WITH_DUPLICATE_CSS" ]; then
    echo "⚠️  Fichiers avec plusieurs imports de style.css :"
    echo "$FILES_WITH_DUPLICATE_CSS"
else
    echo "✅ Pas de doublons CSS"
fi
echo ""

# 6. Vérifier la structure body/app-container
echo "📦 Vérification de la structure HTML..."
PAGES_WITHOUT_APP_CONTAINER=$(find pages/app -name "*.html" -type f ! -exec grep -q "id=\"app-container\"" {} \; -print)
if [ -n "$PAGES_WITHOUT_APP_CONTAINER" ]; then
    echo "⚠️  Pages sans #app-container :"
    echo "$PAGES_WITHOUT_APP_CONTAINER"
fi
echo ""

# Résumé
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo "✅ Aucune erreur critique détectée !"
else
    echo "❌ $ERRORS erreur(s) détectée(s)"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
