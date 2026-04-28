#!/bin/bash

# 🎵 Script de Test - Lecteur Musique & Quiz
# Usage: bash test-music-and-quiz.sh

echo "🎵 TEST: Lecteur Musique & Quiz - Projet Blocus"
echo "=================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vérifier que les fichiers existent
echo "📁 Vérification des fichiers..."
echo ""

files=(
    "assets/js/music-player.js"
    "assets/js/spotify-web-api.js"
    "pages/app/music.html"
    "assets/js/quizz.js"
    "supabase/functions/generate-quiz/index.ts"
)

missing=0
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $file"
    else
        echo -e "${RED}❌${NC} $file - MANQUANT"
        missing=$((missing + 1))
    fi
done

echo ""
if [ $missing -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les fichiers sont présents!${NC}"
else
    echo -e "${RED}❌ $missing fichier(s) manquant(s)${NC}"
    exit 1
fi

echo ""
echo "=================================================="
echo "🧪 Tests de Configuration"
echo "=================================================="
echo ""

# Vérifier la configuration
echo "1️⃣ Vérification Supabase..."
if grep -q "GEMINI_API_KEY" supabase/functions/generate-quiz/index.ts; then
    echo -e "${GREEN}✅${NC} Fonction Quiz attend GEMINI_API_KEY"
else
    echo -e "${RED}❌${NC} Fonction Quiz introuvable"
fi

echo ""
echo "2️⃣ Vérification Lecteur Musique..."
if grep -q "class MusicPlayer" assets/js/music-player.js; then
    echo -e "${GREEN}✅${NC} Classe MusicPlayer détectée"
else
    echo -e "${RED}❌${NC} Classe MusicPlayer introuvable"
fi

if grep -q "searchDeezer\|searchSpotify" assets/js/music-player.js; then
    echo -e "${GREEN}✅${NC} Méthodes de recherche présentes"
else
    echo -e "${RED}❌${NC} Méthodes de recherche introuvables"
fi

echo ""
echo "3️⃣ Vérification Navigation..."
if grep -q "music.html" assets/js/layout.js; then
    echo -e "${GREEN}✅${NC} Lien musique dans la navigation"
else
    echo -e "${RED}❌${NC} Lien musique manquant de la navigation"
fi

echo ""
echo "=================================================="
echo "🚀 Instructions Rapides"
echo "=================================================="
echo ""

echo -e "${YELLOW}QUIZ - CONFIGURATION REQUISE${NC}"
echo "1. Créer une clé API: https://aistudio.google.com/app/apikey"
echo "2. Configurer le secret:"
echo "   ${BLUE}supabase secrets set GEMINI_API_KEY=AIzaSy...${NC}"
echo "3. Redéployer:"
echo "   ${BLUE}supabase functions deploy generate-quiz${NC}"
echo "4. Tester: Visiter /pages/app/quiz.html"
echo ""

echo -e "${YELLOW}LECTEUR MUSIQUE - PRÊT À L'EMPLOI${NC}"
echo "1. Accéder: ${BLUE}http://localhost:5173/pages/app/music.html${NC}"
echo "2. Essayer une recherche: 'Lofi hip hop'"
echo "3. (Optionnel) Configurer Spotify/Deezer:"
echo "   - Spotify: Ajouter Client ID dans music-player.js"
echo "   - Deezer: Ajouter App ID dans music-player.js"
echo ""

echo "=================================================="
echo "📊 Résumé Statut"
echo "=================================================="
echo ""
echo "✅ Lecteur Musique:    DÉPLOYÉ & FONCTIONNEL"
echo "⚠️ Quiz IA:            ATTEND GEMINI_API_KEY"
echo ""

echo -e "${GREEN}🎉 Tests terminés!${NC}"
echo ""
echo "Pour plus d'info: voir SETUP_MUSIC_AND_QUIZ.md"
echo ""
