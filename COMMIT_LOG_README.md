# Système de logging des commits

## Fichiers

- **commit.txt** : Historique des commits au format `[HH:MM:SS] Message`
- **update-commit-log.sh** : Script pour mettre à jour commit.txt
- **.git/hooks/post-commit.disabled** : Hook git automatique (désactivé pour éviter les boucles)

## Utilisation manuelle (recommandée)

Après chaque commit important que tu veux logger :

```bash
./update-commit-log.sh
git add commit.txt
git commit -m "docs: Update commit log"
git push
```

## Utilisation automatique (optionnel)

Si tu veux activer le hook automatique :

```bash
mv .git/hooks/post-commit.disabled .git/hooks/post-commit
```

⚠️ **Attention** : Le hook créera une boucle où commit.txt sera mis à jour après chaque commit. Tu devras alors committer manuellement commit.txt après chaque opération.

## Désactiver le hook

```bash
mv .git/hooks/post-commit .git/hooks/post-commit.disabled
```

## Visualiser l'historique

```bash
cat commit.txt
```
