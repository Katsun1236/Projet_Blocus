#!/bin/bash

echo "🚀 Déploiement de l'Edge Function generate-quiz..."

# Vérifier si Supabase CLI est installé
if ! command -v supabase &> /dev/null
then
    echo "❌ Supabase CLI non trouvé. Installation en cours..."
    npm install -g supabase
fi

echo "📦 Déploiement de la fonction generate-quiz..."
supabase functions deploy generate-quiz --project-ref vhtzudbcfyxnwmpyjyqw

echo "✅ Déploiement terminé !"
