#!/bin/bash

# Script pour supprimer tous les imports Firebase et les remplacer par Supabase

echo "🔄 Remplacement des imports Firebase par Supabase..."

# Liste des fichiers HTML à traiter
files=$(find pages/app pages/auth -name "*.html" -type f)

for file in $files; do
    echo "📝 Traitement de $file"

    # Créer une sauvegarde
    cp "$file" "$file.bak"

    # Supprimer les imports Firebase (auth)
    sed -i '/import.*from.*firebase-auth.js/d' "$file"

    # Supprimer les imports Firebase (firestore)
    sed -i '/import.*from.*firebase-firestore.js/d' "$file"

    # Supprimer les imports Firebase (storage)
    sed -i '/import.*from.*firebase-storage.js/d' "$file"

    echo "✅ $file traité"
done

echo "✨ Terminé ! Les imports Firebase ont été supprimés."
echo "⚠️  Les sauvegardes sont dans *.bak"
