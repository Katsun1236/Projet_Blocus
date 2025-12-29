#!/bin/bash
# Script pour mettre à jour commit.txt avec le dernier commit
# Usage: ./update-commit-log.sh (après avoir fait un commit)

# Récupérer le dernier commit
LAST_COMMIT=$(git log --pretty=format:"[%ad] %s" --date=format:"%H:%M:%S" -n 1)

# Vérifier si commit.txt existe
if [ ! -f "commit.txt" ]; then
    echo "# Historique des commits - Projet Blocus" > commit.txt
    echo "# Format: [HH:MM:SS] Message du commit" >> commit.txt
    echo "" >> commit.txt
fi

# Créer un fichier temporaire avec le nouveau commit en premier
{
    head -n 3 commit.txt
    echo "$LAST_COMMIT"
    tail -n +4 commit.txt
} > commit.txt.tmp

# Remplacer l'ancien fichier
mv commit.txt.tmp commit.txt

echo "✅ commit.txt mis à jour avec: $LAST_COMMIT"
