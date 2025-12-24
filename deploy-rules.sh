#!/bin/bash

echo "🔥 Déploiement des règles Firebase..."
echo ""

# Vérifier si Firebase CLI est installé
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI n'est pas installé"
    echo "Installez-le avec: npm install -g firebase-tools"
    exit 1
fi

# Se connecter si nécessaire
firebase projects:list &> /dev/null
if [ $? -ne 0 ]; then
    echo "🔑 Connexion à Firebase..."
    firebase login
fi

# Déployer les règles
echo "📤 Déploiement des règles Firestore..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Règles déployées avec succès !"
    echo "Les permissions Firebase sont maintenant à jour."
else
    echo ""
    echo "❌ Erreur lors du déploiement"
    echo "Vous pouvez aussi copier les règles manuellement depuis firestore.rules"
fi
